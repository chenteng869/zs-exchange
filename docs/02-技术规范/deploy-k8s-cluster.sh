#!/bin/bash
#=================================================================
# ZS-AI-Platform K8s Cluster Deployment Script
# Compatible: Ubuntu 22.04 LTS
# K8s Version: 1.30.x
# Author: SRE Team
# Created: 2026-06-11
#=================================================================

set -uo pipefail

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[0;37m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# 日志函数
log_info()    { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BLUE}[INFO]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${YELLOW}[WARN]${NC}    $*"; }
log_error()   { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${RED}[ERROR]${NC}   $*"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${GREEN}[OK]${NC}      $*"; }
log_step()    { echo -e "\n${PURPLE}${BOLD}========== $* ==========${NC}"; }
log_debug()   { if [[ "${DEBUG:-false}" == "true" ]]; then echo -e "${CYAN}[DEBUG]${NC} $*"; fi; }

# 全局配置
readonly SCRIPT_VERSION="1.0.0"
readonly K8S_VERSION="1.30.0"
readonly CALICO_VERSION="v3.27.0"
readonly HELM_VERSION="v3.14.4"
readonly CRIO_VERSION="1.30"
readonly POD_CIDR="10.244.0.0/16"
readonly SERVICE_CIDR="10.96.0.0/16"
readonly API_SERVER_VIP="k8s-lb-vip"
readonly API_SERVER_PORT="6443"
readonly IMAGE_REPOSITORY="registry.aliyuncs.com/google_containers"
readonly NTP_SERVER="ntp.aliyun.com"

# Master 节点列表
MASTER_NODES=("k8s-master-01" "k8s-master-02" "k8s-master-03")
WORKER_NODES=("k8s-worker-01" "k8s-worker-02" "k8s-worker-03")
ALL_NODES=("${MASTER_NODES[@]}" "${WORKER_NODES[@]}")

# Master 节点 IP
declare -A NODE_IPS=(
    [k8s-master-01]="192.168.10.11"
    [k8s-master-02]="192.168.10.12"
    [k8s-master-03]="192.168.10.13"
    [k8s-worker-01]="192.168.10.21"
    [k8s-worker-02]="192.168.10.22"
    [k8s-worker-03]="192.168.10.23"
)

# 备份目录
readonly BACKUP_DIR="/backup/k8s-$(date +%Y%m%d-%H%M%S)"

#=================================================================
# 工具函数
#=================================================================

# 检查 root 权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "必须使用 root 用户执行此脚本"
        exit 1
    fi
}

# 检查 OS
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "无法识别操作系统"
        exit 1
    fi
    
    . /etc/os-release
    if [[ "${ID}" != "ubuntu" ]] || [[ "${VERSION_ID}" != "22.04" ]]; then
        log_warn "推荐 Ubuntu 22.04,当前为 ${ID} ${VERSION_ID}"
    fi
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 用户确认
confirm() {
    local prompt=$1
    local default=${2:-"y"}
    local response
    
    if [[ "${FORCE:-false}" == "true" ]]; then
        return 0
    fi
    
    read -rp "$(echo -e "${YELLOW}${prompt} [y/N]: ${NC}")" response
    response=${response:-$default}
    
    [[ "$response" =~ ^[Yy]$ ]]
}

# 错误处理
on_error() {
    local exit_code=$?
    log_error "脚本执行失败,错误码: ${exit_code}"
    log_error "在第 ${BASH_LINENO[0]} 行: ${BASH_COMMAND}"
    
    if [[ "${AUTO_ROLLBACK:-false}" == "true" ]]; then
        log_warn "执行自动回滚..."
        rollback
    fi
    
    exit $exit_code
}

trap on_error ERR

# 重试机制
retry() {
    local max_attempts=$1
    shift
    local attempt=1
    
    until "$@"; do
        if [[ $attempt -ge $max_attempts ]]; then
            log_error "命令执行失败,已达最大重试次数: $max_attempts"
            return 1
        fi
        log_warn "重试中 ($attempt/$max_attempts)..."
        attempt=$((attempt + 1))
        sleep 5
    done
}

#=================================================================
# 阶段 1: 前置检查
#=================================================================

preflight_check() {
    log_step "阶段 1: 前置检查"
    
    log_info "检查 1/10: CPU 核心数..."
    local cpu_cores
    cpu_cores=$(nproc)
    if [[ $cpu_cores -lt 4 ]]; then
        log_error "CPU 核心数不足: ${cpu_cores},至少需要 4 核"
        return 1
    fi
    log_success "CPU 核心数: ${cpu_cores}"
    
    log_info "检查 2/10: 内存大小..."
    local mem_total
    mem_total=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $mem_total -lt 8 ]]; then
        log_error "内存不足: ${mem_total}GB,至少需要 8GB"
        return 1
    fi
    log_success "内存大小: ${mem_total}GB"
    
    log_info "检查 3/10: 磁盘空间..."
    local disk_free
    disk_free=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
    if [[ $disk_free -lt 50 ]]; then
        log_error "磁盘空间不足: ${disk_free}GB,至少需要 50GB"
        return 1
    fi
    log_success "可用磁盘: ${disk_free}GB"
    
    log_info "检查 4/10: 系统版本..."
    check_os
    log_success "OS: ${ID} ${VERSION_ID}"
    
    log_info "检查 5/10: 内核参数..."
    local ip_forward
    ip_forward=$(cat /proc/sys/net/ipv4/ip_forward)
    if [[ "$ip_forward" != "1" ]]; then
        log_warn "IP 转发未开启,稍后会自动配置"
    else
        log_success "IP 转发已开启"
    fi
    
    log_info "检查 6/10: containerd 安装状态..."
    if ! command_exists containerd; then
        log_warn "containerd 未安装,稍后会安装"
    else
        local containerd_ver
        containerd_ver=$(containerd --version | awk '{print $3}')
        log_success "containerd 版本: ${containerd_ver}"
    fi
    
    log_info "检查 7/10: swap 状态..."
    if [[ -n $(swapon --show 2>/dev/null) ]]; then
        log_warn "swap 已启用,稍后会关闭"
    else
        log_success "swap 已关闭"
    fi
    
    log_info "检查 8/10: 防火墙状态..."
    if command_exists ufw && ufw status 2>/dev/null | grep -q "active"; then
        log_warn "ufw 防火墙已启用,稍后会配置规则"
    else
        log_success "防火墙未启用"
    fi
    
    log_info "检查 9/10: 时区设置..."
    local timezone
    timezone=$(timedatectl | grep "Time zone" | awk '{print $3}')
    log_info "当前时区: ${timezone}"
    
    log_info "检查 10/10: 网络连通性..."
    if ! ping -c 3 -W 2 ${NTP_SERVER} >/dev/null 2>&1; then
        log_warn "无法访问 ${NTP_SERVER},请检查网络"
    else
        log_success "网络正常"
    fi
    
    log_success "前置检查通过"
}

#=================================================================
# 阶段 2: 系统初始化
#=================================================================

init_system() {
    log_step "阶段 2: 系统初始化"
    
    log_info "更新 apt 软件源..."
    apt-get update -qq
    
    log_info "升级系统软件包..."
    apt-get upgrade -y -qq
    
    log_info "安装基础工具..."
    apt-get install -y -qq \
        apt-transport-https ca-certificates curl software-properties-common \
        gnupg lsb-release vim git wget jq unzip htop net-tools \
        sysstat iotop nethogs ipvsadm ipset bash-completion \
        chrony sysbench fio iperf3 nfs-common open-iscsi \
        conntrack socat ebtables tc xfsprogs
    
    log_info "配置时区 Asia/Shanghai..."
    timedatectl set-timezone Asia/Shanghai
    timedatectl set-ntp true
    
    log_info "配置 chrony 时间同步..."
    cat > /etc/chrony/chrony.conf <<EOF
pool ${NTP_SERVER} iburst maxsources 4
driftfile /var/lib/chrony/chrony.drift
makestep 1.0 3
rtcsync
logdir /var/log/chrony
EOF
    systemctl restart chrony
    systemctl enable chrony
    
    log_info "关闭 swap..."
    swapoff -a
    sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
    
    log_info "优化内核参数..."
    cat > /etc/sysctl.d/99-kubernetes.conf <<'EOF'
net.ipv4.ip_forward = 1
net.ipv6.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-arptables = 1
vm.swappiness = 0
vm.overcommit_memory = 1
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 8192
net.core.somaxconn = 32768
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_max_syn_backlog = 8096
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.ip_local_port_range = 1024 65535
net.nf_conntrack_max = 1048576
kernel.pid_max = 4194304
kernel.threads-max = 4194304
EOF
    sysctl --system
    
    log_info "加载内核模块..."
    cat > /etc/modules-load.d/k8s.conf <<'EOF'
overlay
br_netfilter
ip_tables
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh
nf_conntrack
xt_set
xt_mark
xt_multiport
xt_comment
xt_NAT
xt_MASQUERADE
EOF
    for mod in overlay br_netfilter ip_tables ip_vs ip_vs_rr ip_vs_wrr ip_vs_sh nf_conntrack xt_set xt_mark xt_multiport xt_comment xt_NAT xt_MASQUERADE; do
        modprobe $mod 2>/dev/null || log_warn "Failed to load module: $mod"
    done
    
    log_info "优化 ulimit..."
    cat >> /etc/security/limits.conf <<'EOF'
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 524288
* hard nproc 524288
* soft memlock unlimited
* hard memlock unlimited
EOF
    
    log_success "系统初始化完成"
}

#=================================================================
# 阶段 3: 安装 containerd
#=================================================================

install_containerd() {
    log_step "阶段 3: 安装 containerd"
    
    log_info "卸载旧版本..."
    for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
        apt-get remove -y $pkg 2>/dev/null || true
    done
    
    log_info "添加 Docker 仓库..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -qq
    
    log_info "安装 containerd..."
    apt-get install -y -qq containerd.io
    
    log_info "配置 containerd..."
    mkdir -p /etc/containerd
    containerd config default | tee /etc/containerd/config.toml > /dev/null
    
    # 配置 cgroup driver
    sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
    sed -i 's|sandbox_image = ".*"|sandbox_image = "registry.k8s.io/pause:3.9"|' /etc/containerd/config.toml
    
    # 配置镜像加速器
    mkdir -p /etc/containerd/certs.d/registry.k8s.io
    cat > /etc/containerd/certs.d/registry.k8s.io/hosts.toml <<'EOF'
server = "https://registry.k8s.io"

[host."https://docker.m.daocloud.io"]
  capabilities = ["pull", "resolve"]

[host."https://dockerproxy.com"]
  capabilities = ["pull", "resolve"]

[host."https://docker.mirrors.ustc.edu.cn"]
  capabilities = ["pull", "resolve"]
EOF
    
    systemctl restart containerd
    systemctl enable containerd
    
    log_success "containerd 安装完成"
}

#=================================================================
# 阶段 4: 安装 Kubernetes 组件
#=================================================================

install_k8s_components() {
    log_step "阶段 4: 安装 Kubernetes 组件"
    
    log_info "添加 Kubernetes 仓库..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
    echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | tee /etc/apt/sources.list.d/kubernetes.list
    
    apt-get update -qq
    
    log_info "安装 kubeadm/kubelet/kubectl ${K8S_VERSION}..."
    apt-get install -y -qq kubelet=${K8S_VERSION}-1.1 kubeadm=${K8S_VERSION}-1.1 kubectl=${K8S_VERSION}-1.1
    apt-get install -y -qq kubernetes-cni
    apt-mark hold kubelet kubeadm kubectl
    
    log_info "配置 kubelet..."
    cat > /etc/default/kubelet <<'EOF'
KUBELET_KUBEADM_EXTRA_ARGS="--container-runtime-endpoint=unix:///var/run/containerd/containerd.sock --cgroup-driver=systemd"
EOF
    systemctl daemon-reload
    systemctl enable --now kubelet
    
    log_info "配置 crictl..."
    cat > /etc/crictl.yaml <<'EOF'
runtime-endpoint: unix:///var/run/containerd/containerd.sock
image-endpoint: unix:///var/run/containerd/containerd.sock
timeout: 10
debug: false
pull-image-on-create: false
EOF
    
    log_success "Kubernetes 组件安装完成"
}

#=================================================================
# 阶段 5: 安装额外工具
#=================================================================

install_extra_tools() {
    log_step "阶段 5: 安装额外工具"
    
    log_info "安装 Helm ${HELM_VERSION}..."
    curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash -s -- --version ${HELM_VERSION}
    
    log_info "安装 k9s..."
    curl -sS https://webi.sh/k9s | sh 2>/dev/null || log_warn "k9s 安装失败,跳过"
    
    log_info "添加常用 Helm 仓库..."
    helm repo add stable https://charts.helm.sh/stable 2>/dev/null || true
    helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null || true
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>/dev/null || true
    helm repo add cert-manager https://charts.jetstack.io 2>/dev/null || true
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
    helm repo add grafana https://grafana.github.io/helm-charts 2>/dev/null || true
    helm repo add loki https://grafana.github.io/loki/charts 2>/dev/null || true
    helm repo add argo https://argoproj.github.io/argo-helm 2>/dev/null || true
    helm repo update
    
    log_success "额外工具安装完成"
}

#=================================================================
# 阶段 6: Master 节点初始化
#=================================================================

init_master() {
    log_step "阶段 6: Master 节点初始化"
    
    local master_ip
    master_ip=$(hostname -I | awk '{print $1}')
    log_info "Master IP: ${master_ip}"
    
    log_info "预拉取镜像..."
    kubeadm config images pull \
        --image-repository=${IMAGE_REPOSITORY} \
        --kubernetes-version=v${K8S_VERSION} \
        --cri-socket=unix:///var/run/containerd/containerd.sock
    
    log_info "执行 kubeadm init..."
    kubeadm init \
        --control-plane-endpoint "${API_SERVER_VIP}:${API_SERVER_PORT}" \
        --upload-certs \
        --apiserver-advertise-address=${master_ip} \
        --apiserver-bind-port=${API_SERVER_PORT} \
        --service-dns-domain=cluster.local \
        --service-cidr=${SERVICE_CIDR} \
        --pod-network-cidr=${POD_CIDR} \
        --image-repository=${IMAGE_REPOSITORY} \
        --kubernetes-version=v${K8S_VERSION} \
        --node-name=$(hostname) \
        --cri-socket=unix:///var/run/containerd/containerd.sock \
        --skip-token-print=false \
        --token-ttl=24h0m0s
    
    log_info "配置 kubectl..."
    mkdir -p $HOME/.kube
    cp -f /etc/kubernetes/admin.conf $HOME/.kube/config
    chown $(id -u):$(id -g) $HOME/.kube/config
    export KUBECONFIG=/etc/kubernetes/admin.conf
    echo "export KUBECONFIG=/etc/kubernetes/admin.conf" >> ~/.bashrc
    
    # 保存 join 命令
    kubeadm token create --print-join-command > /tmp/kubeadm-join.sh
    chmod +x /tmp/kubeadm-join.sh
    log_info "Join 命令已保存到: /tmp/kubeadm-join.sh"
    
    # 上传控制平面 join 命令
    kubeadm init phase upload-certs --upload-certs 2>/dev/null | tail -1 > /tmp/cert-key.txt
    
    log_success "Master 节点初始化完成"
}

#=================================================================
# 阶段 7: 部署 Calico 网络
#=================================================================

install_calico() {
    log_step "阶段 7: 部署 Calico 网络"
    
    log_info "下载 Calico manifest..."
    curl -fsSL -o /tmp/calico.yaml https://raw.githubusercontent.com/projectcalico/calico/${CALICO_VERSION}/manifests/calico.yaml
    
    log_info "修改 IP 池配置..."
    sed -i "s|# - name: IP_AUTODETECTION_METHOD|- name: IP_AUTODETECTION_METHOD|" /tmp/calico.yaml
    sed -i "s|value: \"first-found\"|value: \"interface=ens192\"|" /tmp/calico.yaml
    sed -i "s|192.168.0.0/16|10.244.0.0/16|" /tmp/calico.yaml
    
    log_info "应用 Calico..."
    kubectl apply -f /tmp/calico.yaml
    
    log_info "等待 Calico 就绪..."
    kubectl wait --for=condition=available --timeout=300s deployment/calico-kube-controllers -n kube-system
    kubectl wait --for=condition=ready --timeout=300s pod -l k8s-app=calico-node -n kube-system
    
    log_success "Calico 部署完成"
}

#=================================================================
# 阶段 8: Worker 节点加入
#=================================================================

join_worker() {
    log_step "阶段 8: Worker 节点加入"
    
    local join_cmd
    if [[ -f /tmp/kubeadm-join.sh ]]; then
        join_cmd=$(cat /tmp/kubeadm-join.sh)
    else
        log_error "找不到 join 命令"
        return 1
    fi
    
    for worker in "${WORKER_NODES[@]}"; do
        log_info "将 ${worker} 加入集群..."
        local worker_ip=${NODE_IPS[$worker]}
        
        # 通过 SSH 远程执行
        if confirm "确认将 ${worker} (${worker_ip}) 加入集群?"; then
            ssh -o StrictHostKeyChecking=no root@${worker_ip} "${join_cmd} --node-name=${worker}"
            log_success "${worker} 已加入"
        else
            log_warn "跳过 ${worker}"
        fi
    done
}

#=================================================================
# 阶段 9: 部署集群组件
#=================================================================

install_components() {
    log_step "阶段 9: 部署集群组件"
    
    # 9.1 Metrics Server
    install_metrics_server
    
    # 9.2 Ingress
    install_ingress
    
    # 9.3 Cert-Manager
    install_cert_manager
    
    # 9.4 StorageClass
    install_storageclass
    
    # 9.5 MetalLB
    install_metallb
    
    # 9.6 ArgoCD
    install_argocd
    
    # 9.7 Prometheus
    install_prometheus
    
    # 9.8 Loki
    install_loki
}

install_metrics_server() {
    log_info "部署 metrics-server..."
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    kubectl patch deployment metrics-server -n kube-system --type=json -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
    kubectl rollout restart deployment metrics-server -n kube-system
    log_success "metrics-server 部署完成"
}

install_ingress() {
    log_info "部署 ingress-nginx..."
    kubectl create namespace ingress-nginx --dry-run=client -o yaml | kubectl apply -f -
    helm install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --set controller.kind=DaemonSet \
        --set controller.daemonset.useHostPort=true \
        --set controller.metrics.enabled=true \
        --set controller.service.type=NodePort \
        --set controller.service.nodePorts.http=30080 \
        --set controller.service.nodePorts.https=30443 \
        --version 4.10.0 \
        --wait
    log_success "ingress-nginx 部署完成"
}

install_cert_manager() {
    log_info "部署 cert-manager..."
    helm install cert-manager cert-manager/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.15.0 \
        --set installCRDs=true \
        --set prometheus.enabled=true \
        --wait
    log_success "cert-manager 部署完成"
}

install_storageclass() {
    log_info "部署 Local Path Provisioner..."
    kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml
    kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
    log_success "StorageClass 部署完成"
}

install_metallb() {
    log_info "部署 MetalLB..."
    read -p "是否部署 MetalLB? (y/n): " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml
        log_warn "请手动配置 IPAddressPool"
    fi
}

install_argocd() {
    log_info "部署 ArgoCD..."
    kubectl create namespace argocd
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v2.11.0/manifests/install.yaml
    log_success "ArgoCD 部署完成"
}

install_prometheus() {
    log_info "部署 Prometheus Operator..."
    kubectl create namespace monitoring
    helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=local-path \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
        --set grafana.adminPassword=admin@2026 \
        --wait
    log_success "Prometheus 部署完成"
}

install_loki() {
    log_info "部署 Loki..."
    kubectl create namespace logging
    helm install loki loki/loki-stack \
        --namespace logging \
        --set promtail.enabled=true \
        --set loki.persistence.enabled=true \
        --set loki.persistence.size=50Gi \
        --set loki.persistence.storageClassName=local-path \
        --wait
    log_success "Loki 部署完成"
}

#=================================================================
# 阶段 10: 节点标签
#=================================================================

label_nodes() {
    log_step "阶段 10: 配置节点标签"
    
    for node in "${WORKER_NODES[@]}"; do
        kubectl label node $node node-role.kubernetes.io/worker=true --overwrite
    done
    
    for node in "${MASTER_NODES[@]}"; do
        kubectl label node $node node-role.kubernetes.io/control-plane=true --overwrite
    done
    
    log_success "节点标签配置完成"
}

#=================================================================
# 阶段 11: 验证
#=================================================================

verify_cluster() {
    log_step "阶段 11: 验证集群"
    
    log_info "节点状态:"
    kubectl get nodes -o wide
    
    log_info "系统 Pod:"
    kubectl get pods -n kube-system
    
    log_info "测试 DNS..."
    kubectl run -it --rm dns-test --image=busybox --restart=Never -- nslookup kubernetes.default 2>&1 | head -10
    
    log_info "测试 Pod 网络..."
    kubectl run -it --rm net-test --image=busybox --restart=Never -- wget -qO- --timeout=5 8.8.8.8 2>&1 | head -5 || log_warn "外部网络测试失败"
    
    log_success "集群验证完成"
}

#=================================================================
# 回滚函数
#=================================================================

rollback() {
    log_step "执行回滚"
    
    log_warn "重置 kubeadm..."
    kubeadm reset -f
    
    log_info "清理数据..."
    rm -rf /var/lib/etcd
    rm -rf /var/lib/kubelet
    rm -rf /etc/cni/net.d
    rm -rf /var/lib/containerd
    
    systemctl restart containerd
    systemctl restart kubelet
    
    log_success "回滚完成"
}

#=================================================================
# 备份函数
#=================================================================

backup_etcd() {
    log_step "备份 etcd"
    
    mkdir -p ${BACKUP_DIR}
    
    ETCDCTL_API=3 etcdctl snapshot save ${BACKUP_DIR}/etcd-snapshot.db \
        --endpoints=https://127.0.0.1:2379 \
        --cacert=/etc/kubernetes/pki/etcd/ca.crt \
        --cert=/etc/kubernetes/pki/etcd/server.crt \
        --key=/etc/kubernetes/pki/etcd/server.key
    
    log_success "etcd 备份完成: ${BACKUP_DIR}/etcd-snapshot.db"
}

#=================================================================
# 主函数
#=================================================================

usage() {
    cat <<EOF
ZS-AI-Platform K8s 集群部署脚本 v${SCRIPT_VERSION}

用法: $0 <command> [options]

命令:
  preflight         前置条件检查
  init              完整初始化 (init_system + install_containerd + install_k8s_components)
  init-system       仅系统初始化
  install-containerd  仅安装 containerd
  install-k8s       仅安装 K8s 组件
  init-master       Master 节点初始化
  install-calico    部署 Calico 网络
  join-worker       Worker 节点加入
  install-components 部署集群组件
  label-nodes       配置节点标签
  verify            验证集群
  backup            备份 etcd
  rollback          回滚
  all               执行完整流程
  help              显示帮助

选项:
  --debug           调试模式
  --force           跳过所有确认
  --auto-rollback   失败时自动回滚

示例:
  $0 preflight
  $0 all
  FORCE=true $0 init
EOF
}

main() {
    local cmd=${1:-help}
    shift || true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --debug)
                DEBUG=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --auto-rollback)
                AUTO_ROLLBACK=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    log_info "ZS-AI-Platform K8s 部署脚本 v${SCRIPT_VERSION}"
    log_info "K8s 版本: ${K8S_VERSION}"
    log_info "Calico 版本: ${CALICO_VERSION}"
    
    check_root
    
    case $cmd in
        preflight)
            preflight_check
            ;;
        init)
            init_system
            install_containerd
            install_k8s_components
            install_extra_tools
            ;;
        init-system)
            init_system
            ;;
        install-containerd)
            install_containerd
            ;;
        install-k8s)
            install_k8s_components
            ;;
        init-master)
            init_master
            install_calico
            ;;
        install-calico)
            install_calico
            ;;
        join-worker)
            join_worker
            ;;
        install-components)
            install_components
            label_nodes
            ;;
        label-nodes)
            label_nodes
            ;;
        verify)
            verify_cluster
            ;;
        backup)
            backup_etcd
            ;;
        rollback)
            rollback
            ;;
        all)
            preflight_check
            init_system
            install_containerd
            install_k8s_components
            install_extra_tools
            init_master
            install_calico
            label_nodes
            install_components
            verify_cluster
            backup_etcd
            log_success "完整部署完成!"
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "未知命令: $cmd"
            usage
            exit 1
            ;;
    esac
}

# 入口
main "$@"
