# ZS-AI-Platform K8s 部署标准操作流程 (SOP)

> **文档版本**: v1.0.0  
> **适用版本**: Kubernetes 1.30+ / containerd 1.7+ / Ubuntu 22.04 LTS  
> **最后更新**: 2026-06-11  
> **维护团队**: SRE 平台组  
> **审批人**: 技术委员会

---

## 目录

- [第 1 章 前置条件检查](#第-1-章-前置条件检查)
- [第 2 章 环境配置步骤](#第-2-章-环境配置步骤)
- [第 3 章 部署流程分阶段](#第-3-章-部署流程分阶段)
- [第 4 章 故障排查指南](#第-4-章-故障排查指南)
- [第 5 章 回滚机制](#第-5-章-回滚机制)
- [第 6 章 验证标准](#第-6-章-验证标准)
- [第 7 章 运维手册](#第-7-章-运维手册)
- [附录 A 命令速查](#附录-a-命令速查)
- [附录 B 参考链接](#附录-b-参考链接)

---

## 第 1 章 前置条件检查

> **重要**: 部署前必须完成全部 10 项检查,任一项不通过则禁止进入下一阶段。

### 1.1 服务器配置检查

#### 1.1.1 硬件配置要求

| 角色 | CPU | 内存 | 磁盘 | 网络 | 数量 |
|------|-----|------|------|------|------|
| Master | ≥ 4 核 | ≥ 8 GB | ≥ 100 GB SSD | 千兆 × 2 | 3 |
| Worker | ≥ 8 核 | ≥ 16 GB | ≥ 200 GB SSD | 千兆 × 2 | ≥ 3 |
| Etcd | ≥ 4 核 | ≥ 8 GB | ≥ 100 GB SSD | 千兆 × 2 | 3 (独立部署) |
| 存储节点 | ≥ 8 核 | ≥ 32 GB | ≥ 4 TB HDD | 万兆 | ≥ 3 |

#### 1.1.2 检查命令

```bash
# CPU 信息
lscpu | grep -E "Model name|CPU\(s\)|Thread|Socket|Core"

# 内存信息
free -h
dmidecode -t memory | grep -E "Size|Speed"

# 磁盘信息
lsblk -d -o NAME,SIZE,ROTA,TRAN,MODEL
df -hT
fdisk -l | grep "Disk /dev"

# 网络信息
ip addr show
ethtool ens192 | grep -E "Speed|Duplex"
lspci | grep -i ethernet
cat /sys/class/net/ens192/speed
```

#### 1.1.3 性能基线测试

```bash
# CPU 性能
sysbench cpu --cpu-max-prime=20000 run

# 内存性能
sysbench memory --memory-block-size=1M --memory-total-size=10G run

# 磁盘 IO 性能
fio --name=randwrite --ioengine=libaio --direct=1 --bs=4k \
    --size=1G --rw=randwrite --filename=/tmp/test.fio --runtime=30

# 网络性能
iperf3 -s      # 服务端
iperf3 -c <server_ip> -t 30 -P 4
```

### 1.2 系统版本检查

```bash
# 操作系统版本 (必须为 Ubuntu 22.04 LTS)
cat /etc/os-release
lsb_release -a
uname -a

# 期望输出
# NAME="Ubuntu"
# VERSION="22.04.x LTS (Jammy Jellyfish)"
# ID=ubuntu
# VERSION_ID="22.04"
```

#### 1.2.1 系统更新

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common \
                    gnupg lsb-release vim git wget jq unzip htop net-tools \
                    sysstat iotop nethogs ipvsadm ipset bash-completion
```

### 1.3 内核参数检查

```bash
# 查看当前内核参数
sysctl -a | grep -E "net\.ipv4\.ip_forward|net\.bridge\.bridge-nf-call|vm\.swappiness|fs\.file-max"

# 期望配置
cat > /etc/sysctl.d/99-kubernetes.conf <<EOF
# IP 转发
net.ipv4.ip_forward = 1
net.ipv6.ip_forward = 1

# 桥接流量处理
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1

# 内核性能
vm.swappiness = 0
vm.overcommit_memory = 1
vm.panic_on_oom = 0
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 8192

# 网络优化
net.core.somaxconn = 32768
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_max_syn_backlog = 8096
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr

# 端口范围
net.ipv4.ip_local_port_range = 1024 65535
EOF

# 应用配置
sudo sysctl --system

# 加载必要的内核模块
cat > /etc/modules-load.d/k8s.conf <<EOF
overlay
br_netfilter
ip_tables
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh
nf_conntrack
EOF

sudo modprobe overlay
sudo modprobe br_netfilter
sudo modprobe ip_tables
sudo modprobe ip_vs
sudo modprobe ip_vs_rr
sudo modprobe ip_vs_wrr
sudo modprobe ip_vs_sh
sudo modprobe nf_conntrack
```

### 1.4 Docker 安装检查

```bash
# 检查 Docker 是否已安装
docker --version
docker info 2>&1 | head -20

# 如果未安装或版本不符,执行以下步骤
# 卸载旧版本
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
    sudo apt-get remove -y $pkg 2>/dev/null || true
done

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 containerd (推荐)
sudo apt-get update
sudo apt-get install -y containerd.io

# 配置 containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# 修改 cgroup driver 为 systemd
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo sed -i 's|sandbox_image = ".*"|sandbox_image = "registry.k8s.io/pause:3.9"|' /etc/containerd/config.toml

# 配置镜像加速器
sudo mkdir -p /etc/containerd/certs.d/registry.k8s.io
cat <<EOF | sudo tee /etc/containerd/certs.d/registry.k8s.io/hosts.toml
server = "https://registry.k8s.io"

[host."https://docker.m.daocloud.io"]
  capabilities = ["pull", "resolve"]

[host."https://dockerproxy.com"]
  capabilities = ["pull", "resolve"]

[host."https://docker.mirrors.ustc.edu.cn"]
  capabilities = ["pull", "resolve"]
EOF

# 重启 containerd
sudo systemctl restart containerd
sudo systemctl enable containerd
sudo systemctl status containerd
```

### 1.5 swap 关闭检查

```bash
# 查看当前 swap 状态
swapon --show
free -h | grep -i swap

# 关闭 swap
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# 验证
swapon --show  # 应无输出
cat /proc/swaps  # 应无内容
```

### 1.6 防火墙检查

```bash
# Ubuntu 22.04 默认使用 ufw
sudo ufw status

# 如果启用防火墙,需要开放以下端口

# Master 节点端口
sudo ufw allow 6443/tcp     # Kubernetes API Server
sudo ufw allow 2379:2380/tcp  # etcd
sudo ufw allow 10250/tcp    # Kubelet API
sudo ufw allow 10259/tcp    # kube-scheduler
sudo ufw allow 10257/tcp    # kube-controller-manager
sudo ufw allow 10255/tcp    # Read-only Kubelet API
sudo ufw allow 8472/udp     # Flannel VXLAN
sudo ufw allow 4789/udp     # Flannel VXLAN
sudo ufw allow 30000:32767/tcp  # NodePort Services
sudo ufw allow 51820/udp    # WireGuard (Flannel)
sudo ufw allow 51821/udp    # IPv6 WireGuard (Flannel)
sudo ufw allow 179/tcp      # BGP (Calico)
sudo ufw allow 4789/udp     # Calico VXLAN
sudo ufw allow 443/tcp      # HTTPS
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 22/tcp       # SSH

# Worker 节点端口
sudo ufw allow 10250/tcp    # Kubelet API
sudo ufw allow 10255/tcp    # Read-only Kubelet API
sudo ufw allow 30000:32767/tcp  # NodePort Services
sudo ufw allow 8472/udp     # Flannel VXLAN
sudo ufw allow 4789/udp     # Flannel VXLAN
sudo ufw allow 51820/udp    # WireGuard (Flannel)
sudo ufw allow 51821/udp    # IPv6 WireGuard (Flannel)
sudo ufw allow 179/tcp      # BGP (Calico)
sudo ufw allow 4789/udp     # Calico VXLAN
sudo ufw allow 443/tcp      # HTTPS
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 22/tcp       # SSH

# 或使用 iptables 直接放行
sudo iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport 6443 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### 1.7 SELinux 检查

```bash
# Ubuntu 默认不启用 SELinux,但需要检查 AppArmor
sudo aa-status
sudo systemctl status apparmor

# 如果有冲突,关闭 AppArmor
sudo systemctl stop apparmor
sudo systemctl disable apparmor

# K8s 1.30+ 推荐使用 AppArmor 替代 SELinux 进行安全控制
```

### 1.8 时区同步检查

```bash
# 检查当前时区
timedatectl status
date
cat /etc/timezone

# 配置时区
sudo timedatectl set-timezone Asia/Shanghai

# 安装并配置 chrony
sudo apt-get install -y chrony

cat > /etc/chrony/chrony.conf <<EOF
pool ntp.aliyun.com iburst maxsources 4
pool ntp1.aliyun.com iburst maxsources 4
pool ntp2.aliyun.com iburst maxsources 4
pool ntp3.aliyun.com iburst maxsources 4
pool time.cloudflare.com iburst maxsources 4

driftfile /var/lib/chrony/chrony.drift
makestep 1.0 3
rtcsync
logdir /var/log/chrony
EOF

sudo systemctl restart chrony
sudo systemctl enable chrony

# 验证时间同步
chronyc tracking
chronyc sources -v
chronyc sourcestats -v
```

### 1.9 域名解析检查

```bash
# 配置 /etc/hosts (集群内节点互相解析)
cat >> /etc/hosts <<EOF
# K8s Cluster Nodes
192.168.10.11   k8s-master-01
192.168.10.12   k8s-master-02
192.168.10.13   k8s-master-03
192.168.10.21   k8s-worker-01
192.168.10.22   k8s-worker-02
192.168.10.23   k8s-worker-03
192.168.10.30   k8s-lb-vip
EOF

# 验证解析
ping -c 3 k8s-master-01
nslookup k8s-master-01
getent hosts k8s-master-01

# 配置外部 DNS
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
sudo rm /etc/resolv.conf
cat > /etc/resolv.conf <<EOF
nameserver 223.5.5.5
nameserver 119.29.29.29
nameserver 8.8.8.8
search local
EOF
sudo systemctl restart systemd-resolved 2>/dev/null || true
```

### 1.10 SSH 互信检查

```bash
# 在所有节点生成 SSH 密钥
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519

# Master 节点执行
ssh-copy-id root@k8s-master-01
ssh-copy-id root@k8s-master-02
ssh-copy-id root@k8s-master-03
ssh-copy-id root@k8s-worker-01
ssh-copy-id root@k8s-worker-02
ssh-copy-id root@k8s-worker-03

# 优化 SSH 配置
cat > ~/.ssh/config <<EOF
Host k8s-master-01
    HostName 192.168.10.11
    User root
    StrictHostKeyChecking no
Host k8s-master-02
    HostName 192.168.10.12
    User root
    StrictHostKeyChecking no
Host k8s-master-03
    HostName 192.168.10.13
    User root
    StrictHostKeyChecking no
Host k8s-worker-*
    User root
    StrictHostKeyChecking no
EOF
chmod 600 ~/.ssh/config

# 验证免密登录
ssh k8s-master-01 "hostname && uname -a"
ssh k8s-worker-01 "hostname && uname -a"
```

### 1.11 前置检查清单

| 序号 | 检查项 | 检查命令 | 通过标准 | 负责人 | 状态 |
|------|--------|----------|----------|--------|------|
| 1 | 硬件配置 | lscpu / free -h / lsblk | 满足配置表要求 | 基础设施 | ☐ |
| 2 | 系统版本 | lsb_release -a | Ubuntu 22.04 | 基础设施 | ☐ |
| 3 | 内核参数 | sysctl net.ipv4.ip_forward | = 1 | SRE | ☐ |
| 4 | containerd | containerd --version | ≥ 1.7.x | SRE | ☐ |
| 5 | swap 关闭 | swapon --show | 无输出 | SRE | ☐ |
| 6 | 防火墙 | ufw status | 端口已开放 | 安全 | ☐ |
| 7 | AppArmor | aa-status | 兼容 | 安全 | ☐ |
| 8 | 时区同步 | timedatectl | 同步 CST | SRE | ☐ |
| 9 | 域名解析 | nslookup | 正确解析 | SRE | ☐ |
| 10 | SSH 互信 | ssh k8s-node "date" | 免密成功 | SRE | ☐ |

---

## 第 2 章 环境配置步骤

### 2.1 服务器初始化脚本 (user_data.sh)

> 该脚本用于云平台初始化或全新裸金属服务器,所有节点统一执行。

```bash
#!/bin/bash
#=========================================================
# ZS-AI-Platform K8s Node Initialization Script
# Compatible: Ubuntu 22.04 LTS
# K8s Version: 1.30.x
#=========================================================
set -euo pipefail

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }

# 1. 系统基础配置
log_info "开始系统基础配置..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    vim \
    git \
    wget \
    jq \
    unzip \
    htop \
    net-tools \
    sysstat \
    iotop \
    nethogs \
    ipvsadm \
    ipset \
    bash-completion \
    chrony \
    sysbench \
    fio \
    iperf3 \
    nfs-common \
    open-iscsi \
    conntrack \
    socat \
    ebtables \
    tc \
    xfsprogs

# 2. 配置时区
log_info "配置时区 Asia/Shanghai..."
timedatectl set-timezone Asia/Shanghai
timedatectl set-ntp true

# 3. 配置 chrony
cat > /etc/chrony/chrony.conf <<'CHRONY_EOF'
pool ntp.aliyun.com iburst maxsources 4
pool ntp1.aliyun.com iburst maxsources 4
pool ntp2.aliyun.com iburst maxsources 4
pool ntp3.aliyun.com iburst maxsources 4
driftfile /var/lib/chrony/chrony.drift
makestep 1.0 3
rtcsync
logdir /var/log/chrony
CHRONY_EOF
systemctl restart chrony
systemctl enable chrony

# 4. 关闭 swap
log_info "关闭 swap..."
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# 5. 内核参数优化
log_info "优化内核参数..."
cat > /etc/sysctl.d/99-kubernetes.conf <<'SYSCTL_EOF'
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
fs.aio-max-nr = 524288
fs.protected_regular = 0
net.core.somaxconn = 32768
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_max_syn_backlog = 8096
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.neigh.default.gc_thresh1 = 4096
net.ipv4.neigh.default.gc_thresh2 = 6144
net.ipv4.neigh.default.gc_thresh3 = 8192
net.netfilter.nf_conntrack_max = 1048576
net.nf_conntrack_max = 1048576
kernel.pid_max = 4194304
kernel.threads-max = 4194304
SYSCTL_EOF

sysctl --system

# 6. 加载内核模块
log_info "加载 K8s 所需内核模块..."
cat > /etc/modules-load.d/k8s.conf <<'MODULES_EOF'
overlay
br_netfilter
ip_tables
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh
nf_conntrack
nf_conntrack_ipv4
nf_conntrack_ipv6
xt_set
xt_mark
xt_multiport
xt_comment
xt_NAT
xt_MASQUERADE
MODULES_EOF

for mod in overlay br_netfilter ip_tables ip_vs ip_vs_rr ip_vs_wrr ip_vs_sh nf_conntrack xt_set xt_mark xt_multiport xt_comment xt_NAT xt_MASQUERADE; do
    modprobe $mod || log_warn "Failed to load module: $mod"
done

# 7. 配置 IPVS (kube-proxy 使用)
cat > /etc/modules-load.d/ipvs.conf <<'IPVS_EOF'
ip_vs
ip_vs_lc
ip_vs_wlc
ip_vs_rr
ip_vs_wrr
ip_vs_sh
ip_vs_sed
ip_vs_nq
ip_vs_ftp
ip_vs_sh
nf_conntrack
IPVS_EOF

# 8. 关闭 AppArmor 冲突
log_info "配置 AppArmor..."
cat > /etc/apparmor.d/local/usr.sbin.kubelet <<'APPARMOR_EOF'
# Site-specific additions and overrides for usr.sbin.kubelet.
#include <abstractions/ssl_certs>
APPARMOR_EOF
systemctl restart apparmor

# 9. 安装 containerd
log_info "安装 containerd..."
apt-get install -y containerd.io

mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml

# 修改 cgroup driver
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sed -i 's|sandbox_image = ".*"|sandbox_image = "registry.k8s.io/pause:3.9"|' /etc/containerd/config.toml
sed -i 's|endpoint = ".*"|endpoint = ["unix:///var/run/containerd/containerd.sock"]|' /etc/containerd/config.toml

# 配置镜像加速器
mkdir -p /etc/containerd/certs.d/registry.k8s.io
cat > /etc/containerd/certs.d/registry.k8s.io/hosts.toml <<'REGISTRY_EOF'
server = "https://registry.k8s.io"

[host."https://docker.m.daocloud.io"]
  capabilities = ["pull", "resolve"]

[host."https://dockerproxy.com"]
  capabilities = ["pull", "resolve"]

[host."https://docker.mirrors.ustc.edu.cn"]
  capabilities = ["pull", "resolve"]

[host."https://hub-mirror.c.163.com"]
  capabilities = ["pull", "resolve"]
REGISTRY_EOF

systemctl restart containerd
systemctl enable containerd

# 10. 安装 Kubernetes 组件
log_info "安装 kubeadm/kubelet/kubectl..."
apt-get install -y apt-transport-https ca-certificates curl gpg
mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | tee /etc/apt/sources.list.d/kubernetes.list

apt-get update
apt-get install -y kubelet=1.30.0-* kubeadm=1.30.0-* kubectl=1.30.0-*
apt-get install -y kubernetes-cni

apt-mark hold kubelet kubeadm kubectl

# 11. 配置 kubelet
cat > /etc/default/kubelet <<'KUBELET_EOF'
KUBELET_KUBEADM_EXTRA_ARGS="--container-runtime-endpoint=unix:///var/run/containerd/containerd.sock --cgroup-driver=systemd"
KUBELET_EOF

systemctl daemon-reload
systemctl enable --now kubelet

# 12. 配置 crictl
cat > /etc/crictl.yaml <<'CRICTL_EOF'
runtime-endpoint: unix:///var/run/containerd/containerd.sock
image-endpoint: unix:///var/run/containerd/containerd.sock
timeout: 10
debug: false
pull-image-on-create: false
CRICTL_EOF

# 13. 配置 hosts
cat >> /etc/hosts <<'HOSTS_EOF'
192.168.10.11   k8s-master-01
192.168.10.12   k8s-master-02
192.168.10.13   k8s-master-03
192.168.10.21   k8s-worker-01
192.168.10.22   k8s-worker-02
192.168.10.23   k8s-worker-03
HOSTS_EOF

# 14. 优化 ulimit
cat >> /etc/security/limits.conf <<'LIMITS_EOF'
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 524288
* hard nproc 524288
* soft memlock unlimited
* hard memlock unlimited
LIMITS_EOF

# 15. 优化 systemd 启动参数
mkdir -p /etc/systemd/system/kubelet.service.d
cat > /etc/systemd/system/kubelet.service.d/20-kubelet-args.conf <<'KUBELET_ARGS_EOF'
[Service]
Environment="KUBELET_EXTRA_ARGS=--max-pods=110 --node-status-update-frequency=4s --eviction-pressure-transition-period=30s --eviction-hard=memory.available<5%,nodefs.available<10% --kube-reserved=cpu=500m,memory=512Mi,ephemeral-storage=1Gi --system-reserved=cpu=500m,memory=512Mi,ephemeral-storage=1Gi"
KUBELET_ARGS_EOF

systemctl daemon-reload
systemctl restart kubelet

# 16. 配置 logrotate (containerd 日志)
cat > /etc/logrotate.d/containerd <<'LOGROTATE_EOF'
/var/log/pods/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        /usr/bin/pkill -SIGUSR1 containerd 2>/dev/null || true
    endscript
}
LOGROTATE_EOF

# 17. 安装额外工具
log_info "安装 K8s 生态工具..."
# Helm 3
curl -fsSL -o /tmp/get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 /tmp/get_helm.sh
bash /tmp/get_helm.sh

# k9s
curl -sS https://webi.sh/k9s | sh

# kube-bench (安全基线)
curl -L -o /usr/local/bin/kube-bench.tar.gz https://github.com/aquasecurity/kube-bench/releases/download/v0.10.4/kube-bench_0.10.4_linux_amd64.tar.gz
tar -xvf /usr/local/bin/kube-bench.tar.gz -C /usr/local/bin/
chmod +x /usr/local/bin/kube-bench

# 18. 清理
log_info "清理安装包..."
apt-get clean
rm -rf /var/lib/apt/lists/*
rm -f /tmp/get_helm.sh

# 19. 重启系统提示
cat <<'COMPLETE_EOF'

=================================================
 K8s 节点初始化完成!

 主机名: $(hostname)
 内核版本: $(uname -r)
 containerd: $(containerd --version)
 kubeadm: $(kubeadm version)
 kubelet: $(kubelet --version)
 kubectl: $(kubectl version --client)

 下一步:
  1. Master 节点: 运行 kubeadm init
  2. Worker 节点: 使用 join 命令加入集群
=================================================
COMPLETE_EOF

log_success "初始化脚本执行完成!"
```

### 2.2 Docker 安装步骤

> **本项目推荐使用 containerd 作为容器运行时**,Docker 仅在开发机使用。

```bash
# 仅开发机安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh --mirror Aliyun
sudo usermod -aG docker $USER
newgrp docker

# 配置 Docker daemon.json
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "live-restore": true,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  }
}
EOF

sudo systemctl restart docker
sudo systemctl enable docker
```

### 2.3 containerd 配置

完整配置 `/etc/containerd/config.toml`:

```toml
version = 2

[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "registry.k8s.io/pause:3.9"
  containerd = "/run/containerd/containerd.sock"
  system_container_cgroup = ""
  cni_util = ""
  network_plugin = ""
  enable_unprivileged_ports = false
  enable_unprivileged_icmp = false
  disable_apparmor = false
  restrict_oom_score_adj = true
  max_container_log_line_size = 16384
  disable_cgroup = false
  disable_hugetlb_controller = true
  device_ownership_from_security_context = false
  ignore_image_defined_volumes = false

[plugins."io.containerd.grpc.v1.cri".containerd]
  snapshotter = "overlayfs"
  default_runtime_name = "runc"
  no_pivot = false
  disable_snapshot_annotations = true
  discard_unpacked_layers = false
  ignore_rdt_not_enabled_errors = false

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  runtime_type = "io.containerd.runc.v2"
  runtime_path = ""
  root = ""
  systemd_cgroup = true
  criu_image = "registry.k8s.io/criu/criu:v1.17.1"
  criu_work_path = "/var/lib/containerd/criu"
  criu_dump_management_address = ""
  criu_dump_request_address = ""
  criu_resource_path = ""
  criu_image_work_path = ""
  criu_path = ""
  criu_allow_net_admin = false

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  BinaryName = "runc"
  Root = ""
  Rootless = false
  NoNewKeyring = false
  CriuAnnotationPath = ""
  CriuWorkPath = ""
  IoGid = 0
  IoUid = 0
  ShimCgroup = ""
  SystemdCgroup = true

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
    runtime_type = "io.containerd.runc.v2"
    sandbox_image = "registry.k8s.io/pause:3.9"
    sandbox_mode = "podsandbox"
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
      SystemdCgroup = true

[plugins."io.containerd.grpc.v1.cri".cni]
  bin_dir = "/opt/cni/bin"
  conf_dir = "/etc/cni/net.d"
  max_conf_num = 1
  conf_template = ""

[plugins."io.containerd.grpc.v1.cri".registry]
  config_path = "/etc/containerd/certs.d"

[plugins."io.containerd.internal.v1.opt"]
  path = "/opt/containerd"

[plugins."io.containerd.grpc.v1.cri".registry.configs]
  [plugins."io.containerd.grpc.v1.cri".registry.configs."docker.m.daocloud.io"]
    [plugins."io.containerd.grpc.v1.cri".registry.configs."docker.m.daocloud.io".tls]
      insecure_skip_verify = true
```

### 2.4 kubeadm/kubelet/kubectl 安装

```bash
# 添加 Kubernetes 仓库 (v1.30)
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | \
    sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | \
    sudo tee /etc/apt/sources.list.d/kubernetes.list

# 安装指定版本
sudo apt-get update
sudo apt-get install -y kubelet=1.30.0-1.1 kubeadm=1.30.0-1.1 kubectl=1.30.0-1.1
sudo apt-mark hold kubelet kubeadm kubectl

# 启用 bash completion
echo 'source <(kubectl completion bash)' >> ~/.bashrc
echo 'alias k=kubectl' >> ~/.bashrc
echo 'complete -F __start_kubectl k' >> ~/.bashrc
```

### 2.5 crictl 配置

```bash
cat > /etc/crictl.yaml <<'EOF'
runtime-endpoint: unix:///var/run/containerd/containerd.sock
image-endpoint: unix:///var/run/containerd/containerd.sock
timeout: 10
debug: false
pull-image-on-create: false
disable-pull-on-run: false
EOF

# 测试
crictl info
crictl ps -a
```

### 2.6 cgroup driver 配置

```bash
# 确认 cgroup driver 一致 (kubelet 与 containerd 都使用 systemd)
cat /etc/containerd/config.toml | grep SystemdCgroup
cat /var/lib/kubelet/config.yaml | grep cgroupDriver

# 期望输出:
# SystemdCgroup = true
# cgroupDriver: systemd

# 如不一致,需要修改后重启
# 修改 containerd
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd

# 修改 kubelet
cat > /var/lib/kubelet/config.yaml <<'EOF'
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
EOF
sudo systemctl restart kubelet
```

---

## 第 3 章 部署流程分阶段

### 3.1 阶段 A: Master 节点初始化

#### 3.1.1 kubeadm init 完整命令

```bash
# 在 k8s-master-01 节点执行
sudo kubeadm init \
    --control-plane-endpoint "k8s-lb-vip:6443" \
    --upload-certs \
    --apiserver-advertise-address=192.168.10.11 \
    --apiserver-bind-port=6443 \
    --service-dns-domain=cluster.local \
    --service-cidr=10.96.0.0/16 \
    --pod-network-cidr=10.244.0.0/16 \
    --image-repository=registry.aliyuncs.com/google_containers \
    --kubernetes-version=v1.30.0 \
    --node-name=k8s-master-01 \
    --cri-socket=unix:///var/run/containerd/containerd.sock \
    --etcd-servers=https://192.168.10.11:2379,https://192.168.10.12:2379,https://192.168.10.13:2379 \
    --skip-token-print=false \
    --token-ttl=24h0m0s

# 期望输出示例:
# Your Kubernetes control-plane has initialized successfully!
# 
# To start using your cluster, you need to run the following as a regular user:
#   mkdir -p $HOME/.kube
#   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
#   sudo chown $(id -u):$(id -g) $HOME/.kube/config
#
# Alternatively, if you are the root user, you can run:
#   export KUBECONFIG=/etc/kubernetes/admin.conf
#
# You can now join any number of control-plane nodes by running the following
# command on each as root:
#   kubeadm join k8s-lb-vip:6443 --token xxx \
#     --discovery-token-ca-cert-hash sha256:xxx \
#     --control-plane --certificate-key xxx
#
# Then you can join any number of worker nodes by running the following
# on each as root:
#   kubeadm join k8s-lb-vip:6443 --token xxx \
#     --discovery-token-ca-cert-hash sha256:xxx
```

#### 3.1.2 kubectl 配置

```bash
# 在所有 Master 节点执行
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 配置 kubeconfig 默认使用
export KUBECONFIG=/etc/kubernetes/admin.conf
echo "export KUBECONFIG=/etc/kubernetes/admin.conf" >> ~/.bashrc

# 验证
kubectl version
kubectl get nodes
kubectl get cs
```

#### 3.1.3 网络插件 (Calico) 部署

```bash
# 下载 Calico manifest
curl -O https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml

# 修改 IP 池配置
# 默认使用 192.168.0.0/16,需修改为 10.244.0.0/16
cat > calico-custom.yaml <<'EOF'
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  registry: docker.io
  imagePath: calico
  imagePrefix: calico
  cni:
    ipam:
      type: CalicoIPAM
  calicoNetwork:
    ipPools:
      - blockSize: 26
        cidr: 10.244.0.0/16
        encapsulation: VXLANCrossSubnet
        natOutgoing: Enabled
        nodeSelector: all()
        interface: ens192
    bgp: Enabled
    bgpPeers:
      - peerIP: 192.168.10.21
        asNumber: 64512
      - peerIP: 192.168.10.22
        asNumber: 64512
      - peerIP: 192.168.10.23
        asNumber: 64512
  nodeMetrics:
    enabled: true
  componentLogs:
    enabled: true
  rolloutStrategy:
    rollingUpdate:
      maxUnavailable: 1
    type: RollingUpdate
EOF

# 应用
kubectl apply -f calico-custom.yaml

# 或使用标准部署
kubectl apply -f calico.yaml

# 验证
watch kubectl get pods -n calico-system
kubectl get nodes -o wide
```

#### 3.1.4 CoreDNS 验证

```bash
# 检查 CoreDNS 状态
kubectl get pods -n kube-system -l k8s-app=kube-dns

# 期望输出
# NAME                       READY   STATUS    RESTARTS   AGE
# coredns-65bb46cdc4-abcde   1/1     Running   0          2m
# coredns-65bb46cdc4-fghij   1/1     Running   0          2m

# 创建测试 Pod
kubectl run -it --rm dns-test --image=busybox --restart=Never -- nslookup kubernetes

# 期望输出
# Server:    10.96.0.10
# Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local
# Name:      kubernetes
# Address 1: 10.96.0.1 kubernetes.default.svc.cluster.local
```

### 3.2 阶段 B: Worker 节点加入

#### 3.2.1 kubeadm join 命令

```bash
# 在 k8s-worker-01/02/03 节点执行
sudo kubeadm join k8s-lb-vip:6443 \
    --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
    --cri-socket=unix:///var/run/containerd/containerd.sock \
    --node-name=k8s-worker-01 \
    --ignore-preflight-errors=Swap

# 期望输出
# This node has joined the cluster:
# * Certificate signing request was approved
# * Node successfully joined the cluster
```

#### 3.2.2 节点标签

```bash
# 在 Master 节点执行
# 查看所有节点
kubectl get nodes

# 打标签 (根据角色和用途)
kubectl label node k8s-master-01 node-role.kubernetes.io/master=true
kubectl label node k8s-master-01 node-role.kubernetes.io/control-plane=true
kubectl label node k8s-master-02 node-role.kubernetes.io/master=true
kubectl label node k8s-master-02 node-role.kubernetes.io/control-plane=true
kubectl label node k8s-master-03 node-role.kubernetes.io/master=true
kubectl label node k8s-master-03 node-role.kubernetes.io/control-plane=true

# Worker 标签
kubectl label node k8s-worker-01 node-role.kubernetes.io/worker=true
kubectl label node k8s-worker-01 workload=general
kubectl label node k8s-worker-02 node-role.kubernetes.io/worker=true
kubectl label node k8s-worker-02 workload=gpu
kubectl label node k8s-worker-03 node-role.kubernetes.io/worker=true
kubectl label node k8s-worker-03 workload=storage

# 区域标签 (多可用区)
kubectl label node k8s-master-01 topology.kubernetes.io/zone=cn-shanghai-1a
kubectl label node k8s-worker-01 topology.kubernetes.io/zone=cn-shanghai-1a
kubectl label node k8s-worker-02 topology.kubernetes.io/zone=cn-shanghai-1b
kubectl label node k8s-worker-03 topology.kubernetes.io/zone=cn-shanghai-1c

# GPU 节点
kubectl label node k8s-worker-02 accelerator=nvidia-gpu
kubectl label node k8s-worker-02 nvidia.com/gpu.product=A100-SXM4-40GB
```

#### 3.2.3 污点设置

```bash
# Master 节点默认污点
kubectl taint nodes k8s-master-01 node-role.kubernetes.io/control-plane:NoSchedule
kubectl taint nodes k8s-master-02 node-role.kubernetes.io/control-plane:NoSchedule
kubectl taint nodes k8s-master-03 node-role.kubernetes.io/control-plane:NoSchedule

# GPU 节点专属 (普通 Pod 不调度)
kubectl taint nodes k8s-worker-02 dedicated=gpu:NoSchedule

# 数据库节点 (避免影响)
kubectl taint nodes k8s-worker-03 dedicated=db:NoSchedule

# 允许 Master 节点运行系统组件
kubectl taint nodes k8s-master-01 node-role.kubernetes.io/control-plane:NoSchedule-
# 等等,这是取消污点的写法 (末尾加 `-`)

# 查看污点
kubectl describe node k8s-master-01 | grep Taints
```

### 3.3 阶段 C: 集群组件部署

#### 3.3.1 Helm 安装

```bash
# 一键安装
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

# 验证
helm version
helm completion bash > /etc/bash_completion.d/helm
echo 'source <(helm completion bash)' >> ~/.bashrc

# 添加常用仓库
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add cert-manager https://charts.jetstack.io
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add loki https://grafana.github.io/loki/charts
helm repo update
```

#### 3.3.2 Ingress (Nginx) 部署

```bash
# 创建命名空间
kubectl create namespace ingress-nginx

# 安装 ingress-nginx (裸金属/内部 LB 模式)
helm install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --set controller.kind=DaemonSet \
    --set controller.daemonset.useHostPort=true \
    --set controller.metrics.enabled=true \
    --set controller.podAnnotations."prometheus\.io/scrape"=true \
    --set controller.podAnnotations."prometheus\.io/port"=10254 \
    --set controller.service.type=NodePort \
    --set controller.service.nodePorts.http=30080 \
    --set controller.service.nodePorts.https=30443 \
    --set controller.ingressClassResource.default=true \
    --set controller.ingressClass=nginx \
    --set controller.admissionWebhooks.enabled=true \
    --version 4.10.0

# 验证
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
curl -I http://<node-ip>:30080
```

#### 3.3.3 cert-manager 部署

```bash
# 安装 cert-manager
helm install cert-manager cert-manager/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --version v1.15.0 \
    --set installCRDs=true \
    --set prometheus.enabled=true \
    --set webhook.timeoutSeconds=30

# 创建 ClusterIssuer
cat > cluster-issuer.yaml <<'EOF'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@zs-ai-platform.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ops@zs-ai-platform.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

kubectl apply -f cluster-issuer.yaml

# 验证
kubectl get clusterissuers
kubectl get pods -n cert-manager
```

#### 3.3.4 MetalLB 部署 (裸金属环境)

```bash
# 部署 MetalLB
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml

# 等待就绪
watch kubectl get pods -n metallb-system

# 配置 IP 池
cat > metallb-config.yaml <<'EOF'
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: first-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.10.50-192.168.10.99
  autoAssign: true
  avoidBuggyIPs: false
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2-advert
  namespace: metallb-system
spec:
  ipAddressPools:
  - first-pool
  interfaces:
  - ens192
---
apiVersion: metallb.io/v1beta1
kind: BGPAdvertisement
metadata:
  name: bgp-advert
  namespace: metallb-system
spec:
  ipAddressPools:
  - first-pool
  ipAddressPoolsSelectors:
  - matchLabels:
      zone: public
EOF

kubectl apply -f metallb-config.yaml
```

#### 3.3.5 StorageClass 配置

```bash
# 使用本地存储 (Local Path Provisioner)
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml

# 设置默认 StorageClass
kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

# 验证
kubectl get sc
kubectl get pods -n local-path-storage
```

#### 3.3.6 HPA 配置

```bash
# 安装 metrics-server
helm install metrics-server prometheus-community/kube-state-metrics \
    --namespace monitoring \
    --create-namespace \
    --set metricLabelsAllowlist[0]=pods=[*] \
    --set metricLabelsAllowlist[1]=nodes=[*]

# 部署 metrics-server
cat > metrics-server.yaml <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: metrics-server
  namespace: kube-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metrics-server
  namespace: kube-system
  labels:
    k8s-app: metrics-server
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  replicas: 2
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      serviceAccountName: metrics-server
      containers:
      - name: metrics-server
        image: registry.k8s.io/metrics-server/metrics-server:v0.7.1
        args:
          - --cert-dir=/tmp
          - --secure-port=10250
          - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
          - --kubelet-use-node-status-port
          - --metric-resolution=15s
          - --requestheader-client-ca-file=/etc/kubernetes/pki/front-proxy-ca.crt
        ports:
        - containerPort: 10250
          name: https
        resources:
          requests:
            cpu: 100m
            memory: 200Mi
EOF

kubectl apply -f metrics-server.yaml

# 验证
kubectl top nodes
kubectl top pods -A
```

#### 3.3.7 命名空间规划

```bash
# 业务命名空间
for ns in production staging development monitoring logging argocd cert-manager ingress-nginx metallb-system local-path-storage kube-prometheus-stack grafana loki prometheus harbor; do
    kubectl create namespace $ns --dry-run=client -o yaml | kubectl apply -f -
done

# 设置资源配额
cat > ns-quota.yaml <<'EOF'
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    persistentvolumeclaims: "50"
    pods: "500"
    services: "100"
    secrets: "100"
    configmaps: "100"
    services.loadbalancers: "10"
    services.nodeports: "30"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 200m
      memory: 256Mi
    max:
      cpu: "4"
      memory: 8Gi
    min:
      cpu: 100m
      memory: 128Mi
    type: Container
EOF

kubectl apply -f ns-quota.yaml
```

### 3.4 阶段 D: 业务组件部署

#### 3.4.1 ArgoCD 部署

```bash
# 创建命名空间
kubectl create namespace argocd

# 安装 ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v2.11.0/manifests/install.yaml

# 配置 LoadBalancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "nodePorts": ["30080"]}}'

# 或使用 Ingress
cat > argocd-ingress.yaml <<'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: HTTPS
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  rules:
  - host: argocd.zs-ai-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
  tls:
  - hosts:
    - argocd.zs-ai-platform.com
    secretName: argocd-tls
EOF

kubectl apply -f argocd-ingress.yaml

# 初始密码
ARGOCD_PWD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD 初始密码: $ARGOCD_PWD"

# 验证
kubectl get pods -n argocd
```

#### 3.4.2 Prometheus Operator 部署

```bash
# 添加 Helm 仓库
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 安装 kube-prometheus-stack
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    --set prometheus.prometheusSpec.retention=30d \
    --set prometheus.prometheusSpec.retentionSize=50GiB \
    --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=local-path \
    --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes[0]=ReadWriteOnce \
    --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
    --set prometheus.prometheusSpec.resources.requests.cpu=500m \
    --set prometheus.prometheusSpec.resources.requests.memory=2Gi \
    --set prometheus.prometheusSpec.resources.limits.cpu=2 \
    --set prometheus.prometheusSpec.resources.limits.memory=8Gi \
    --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
    --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false \
    --set grafana.adminPassword=admin@2026 \
    --set grafana.persistence.enabled=true \
    --set grafana.persistence.size=10Gi \
    --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.storageClassName=local-path \
    --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.accessModes[0]=ReadWriteOnce \
    --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=20Gi

# 验证
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

#### 3.4.3 Grafana 部署

```bash
# 已通过 kube-prometheus-stack 安装,配置数据源
# 访问 Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80 --address=0.0.0.0

# 导入 Dashboard
# 推荐 ID: 315 (集群总览)
# 推荐 ID: 6417 (节点详情)
# 推荐 ID: 7249 (K8s Pods)
# 推荐 ID: 11074 (K8s Nodes)

# 启用匿名访问 (生产禁用)
kubectl edit deploy kube-prometheus-stack-grafana -n monitoring
# 在 GF_AUTH_ANONYMOUS_ENABLED 改为 true
```

#### 3.4.4 Loki 部署

```bash
# 添加仓库
helm repo add loki https://grafana.github.io/loki/charts
helm repo update

# 安装 Loki
helm install loki loki/loki-stack \
    --namespace logging \
    --create-namespace \
    --set promtail.enabled=true \
    --set loki.persistence.enabled=true \
    --set loki.persistence.size=50Gi \
    --set loki.persistence.storageClassName=local-path \
    --set loki.config.storage_config.aws.s3=s3 \
    --set loki.config.storage_config.aws.s3.region=cn-shanghai \
    --set loki.config.storage_config.aws.s3.bucketnames=loki-data \
    --set promtail.lokiAddress=http://loki:3100/loki/api/v1/push \
    --set promtail.config.file=/etc/promtail/config.yaml

# 验证
kubectl get pods -n logging
```

#### 3.4.5 Harbor 部署

```bash
# 使用 Helm 部署 Harbor
helm repo add harbor https://helm.goharbor.io
helm repo update

# 创建命名空间
kubectl create namespace harbor

# 安装
helm install harbor harbor/harbor \
    --namespace harbor \
    --set expose.type=ingress \
    --set expose.ingress.hosts.core=harbor.zs-ai-platform.com \
    --set expose.ingress.hosts.notary=notary.zs-ai-platform.com \
    --set expose.ingress.controller=nginx \
    --set externalURL=https://harbor.zs-ai-platform.com \
    --set persistence.persistentVolumeClaim.registry.size=500Gi \
    --set persistence.persistentVolumeClaim.chartmuseum.size=50Gi \
    --set persistence.persistentVolumeClaim.jobservice.size=10Gi \
    --set persistence.persistentVolumeClaim.database.size=20Gi \
    --set persistence.persistentVolumeClaim.redis.size=10Gi \
    --set persistence.persistentVolumeClaim.trivy.size=10Gi \
    --set harborAdminPassword=Harbor@2026 \
    --set metric.enabled=true \
    --set notary.enabled=true \
    --set trivy.enabled=true \
    --set chartmuseum.enabled=true

# 验证
kubectl get pods -n harbor
kubectl get ingress -n harbor

# 客户端配置
echo '{
  "insecure-registries": ["harbor.zs-ai-platform.com"]
}' > /etc/docker/daemon.json
systemctl restart docker
docker login harbor.zs-ai-platform.com -u admin -p 'Harbor@2026'
```

---

## 第 4 章 故障排查指南

### 4.1 节点 NotReady

#### 现象

```bash
kubectl get nodes
# NAME           STATUS     ROLES           AGE     VERSION
# k8s-worker-01 NotReady   <none>          2d      v1.30.0
```

#### 排查步骤

```bash
# 1. 查看节点详情
kubectl describe node k8s-worker-01

# 2. 查看 kubelet 日志
sudo journalctl -u kubelet -n 200 --no-pager

# 3. 常见原因及解决方案

# 原因 1: containerd 异常
sudo systemctl status containerd
sudo systemctl restart containerd
sudo systemctl restart kubelet

# 原因 2: 网络插件故障
kubectl get pods -n kube-system -l k8s-app=calico-node
kubectl logs -n kube-system -l k8s-app=calico-node --tail=100

# 原因 3: 磁盘满
df -h
sudo du -sh /var/lib/containerd/* 2>/dev/null | sort -rh | head -10
sudo crictl rmi --prune

# 原因 4: 内存压力
free -h
dmesg | grep -i "out of memory"

# 原因 5: 时间不同步
chronyc tracking
sudo systemctl restart chrony
```

### 4.2 Pod Pending

#### 现象

```bash
kubectl get pod test-7c8b8d8f9-x7z2k -n production
# NAME                     READY   STATUS    RESTARTS   AGE
# test-7c8b8d8f9-x7z2k     0/1     Pending   0          5m
```

#### 排查步骤

```bash
# 1. 查看 Pod 事件
kubectl describe pod test-7c8b8d8f9-x7z2k -n production

# 2. 常见原因

# 原因 1: 资源不足
kubectl describe nodes | grep -A 5 "Allocated resources"
kubectl get pods -A --field-selector=status.phase=Running -o json | \
    jq '.items[] | {name: .metadata.name, namespace: .metadata.namespace, cpu: .spec.containers[].resources.requests.cpu, memory: .spec.containers[].resources.requests.memory}'

# 原因 2: 节点选择器/亲和性不匹配
kubectl get pod test-7c8b8d8f9-x7z2k -n production -o yaml | grep -A 10 nodeSelector

# 原因 3: PVC 未绑定
kubectl get pvc
kubectl describe pvc <pvc-name>

# 原因 4: 污点
kubectl describe node | grep Taints
```

### 4.3 CrashLoopBackOff

#### 排查命令

```bash
# 1. 查看 Pod 状态
kubectl get pod <pod-name> -n <namespace>

# 2. 查看日志
kubectl logs <pod-name> -n <namespace> --previous
kubectl logs <pod-name> -n <namespace> -c <container-name> --previous

# 3. 详细事件
kubectl describe pod <pod-name> -n <namespace>

# 4. 进入调试模式
kubectl debug <pod-name> -n <namespace> --image=busybox --target=<container-name>

# 5. 常见原因
# - 启动命令错误
# - 配置文件缺失
# - 环境变量错误
# - 健康检查失败
# - 依赖服务未就绪
```

### 4.4 ImagePullBackOff

```bash
# 1. 验证镜像是否存在
docker pull <image>:<tag>

# 2. 检查镜像拉取凭证
kubectl get secret <secret-name> -n <namespace> -o yaml
kubectl get secret regcred -n <namespace> -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d | jq

# 3. 重新创建凭证
kubectl create secret docker-registry regcred \
    --docker-server=harbor.zs-ai-platform.com \
    --docker-username=admin \
    --docker-password='Harbor@2026' \
    --docker-email=ops@zs-ai-platform.com \
    -n <namespace>

# 4. 验证镜像源配置
cat /etc/containerd/config.toml | grep -A 5 "registry.k8s.io"
```

### 4.5 OOMKilled

```bash
# 1. 查看 Pod 资源使用
kubectl top pod <pod-name> -n <namespace>

# 2. 查看 OOM 事件
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 "Last State"

# 3. 增加内存限制
resources:
  limits:
    memory: 2Gi
  requests:
    memory: 1Gi

# 4. 节点级别 OOM
dmesg -T | grep -i "killed process"
journalctl -k | grep -i "killed process"
```

### 4.6 DNS 解析失败

```bash
# 1. 测试 CoreDNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup kubernetes.default

# 2. 检查 CoreDNS 状态
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns

# 3. 检查 resolv.conf
kubectl exec -it <pod-name> -n <namespace> -- cat /etc/resolv.conf

# 4. 重启 CoreDNS
kubectl rollout restart deployment coredns -n kube-system

# 5. 修改 nodelocaldns
```

### 4.7 网络不通

```bash
# 1. 检查 Pod IP
kubectl get pod -o wide

# 2. 同节点 Pod 通信
kubectl exec -it <pod-a> -- ping <pod-b-ip>

# 3. 跨节点 Pod 通信
kubectl exec -it <pod-a> -- nc -zv <pod-b-ip> 80

# 4. 检查 CNI
ls /etc/cni/net.d/
cat /etc/cni/net.d/10-calico.conflist

# 5. 重启网络插件
kubectl delete pod -n kube-system -l k8s-app=calico-node
```

### 4.8 存储挂载失败

```bash
# 1. 查看 PVC/PV 状态
kubectl get pvc,pv
kubectl describe pvc <pvc-name>

# 2. 检查 StorageClass
kubectl get sc

# 3. 检查 CSI 驱动
kubectl get pods -n kube-system | grep csi

# 4. 手动测试挂载
sudo mount -t nfs <nfs-server>:<path> /mnt/test
```

### 4.9 证书过期

```bash
# 1. 查看证书过期时间
sudo kubeadm certs check-expiration

# 2. 续期所有证书
sudo kubeadm certs renew all

# 3. 重启相关组件
sudo systemctl restart kubelet
sudo systemctl restart containerd

# 4. 手动更新 admin.conf
sudo cp /etc/kubernetes/admin.conf ~/.kube/config
```

### 4.10 etcd 故障

```bash
# 1. 查看 etcd 集群状态
sudo ETCDCTL_API=3 etcdctl \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key \
    member list

# 2. 备份 etcd
sudo ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key

# 3. 恢复 etcd
sudo ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot.db \
    --data-dir=/var/lib/etcd-restore \
    --name=master-1 \
    --initial-cluster=master-1=https://192.168.10.11:2380,master-2=https://192.168.10.12:2380,master-3=https://192.168.10.13:2380 \
    --initial-advertise-peer-urls=https://192.168.10.11:2380
```

### 4.11 API Server 502

```bash
# 1. 检查 API Server 状态
sudo systemctl status kube-apiserver
sudo journalctl -u kube-apiserver -n 200

# 2. 检查 etcd 健康
sudo ETCDCTL_API=3 etcdctl endpoint health \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key

# 3. 验证网络
nc -zv 192.168.10.11 6443

# 4. 重启服务
sudo systemctl restart kube-apiserver
```

### 4.12 节点驱逐

```bash
# 1. 主动驱逐 (维护前)
kubectl drain k8s-worker-01 --ignore-daemonsets --delete-emptydir-data --force

# 2. 恢复
kubectl uncordon k8s-worker-01

# 3. 污点驱逐
kubectl taint nodes k8s-worker-01 maintenance=true:NoExecute
```

### 4.13 资源不足

```bash
# 1. 查看节点资源
kubectl top nodes
kubectl describe nodes | grep -A 10 "Allocated resources"

# 2. 优化思路
# - 增加节点
# - 调整 requests/limits
# - 使用 HPA
# - 清理无用资源

# 3. 设置 LimitRange
```

### 4.14 镜像拉取慢

```bash
# 1. 配置镜像加速器
cat /etc/containerd/certs.d/registry.k8s.io/hosts.toml

# 2. 预拉取镜像
kubeadm config images pull --cri-socket=unix:///var/run/containerd/containerd.sock

# 3. 使用本地镜像仓库
# Harbor / Nexus / cdn-cache
```

### 4.15 端口冲突

```bash
# 1. 查看端口占用
sudo netstat -tlnp | grep 6443
sudo lsof -i :6443

# 2. 解决
# - 修改服务端口
# - 停止占用进程
# - 使用 hostNetwork
```

### 4.16 权限问题 (RBAC)

```bash
# 1. 查看权限
kubectl auth can-i create pods --as=system:serviceaccount:production:default -n production

# 2. 查看 RoleBinding
kubectl get rolebindings,clusterrolebindings -A

# 3. 调试模式
kubectl auth can-i list pods --all-namespaces
```

### 4.17 时钟不同步

```bash
# 1. 检查时间差
date
sudo ntpdate ntp.aliyun.com

# 2. 配置 chrony
sudo systemctl restart chrony
chronyc tracking

# 3. 影响
# - 证书验证失败
# - etcd 选举失败
# - 日志混乱
```

### 4.18 内核参数错误

```bash
# 1. 检查 IP 转发
cat /proc/sys/net/ipv4/ip_forward
# 必须为 1

# 2. 检查桥接
cat /proc/sys/net/bridge/bridge-nf-call-iptables
# 必须为 1

# 3. 重新加载
sudo sysctl --system
```

### 4.19 配额超限

```bash
# 1. 查看配额
kubectl get resourcequota -A
kubectl describe resourcequota -n production

# 2. 调整配额
kubectl edit resourcequota compute-quota -n production
```

### 4.20 CRD 冲突

```bash
# 1. 查看 CRD
kubectl get crd | grep <name>

# 2. 冲突时删除
kubectl delete crd <crd-name>

# 3. 检查版本
kubectl get crd <crd-name> -o yaml | grep -A 5 versions
```

### 4.21 真实故障案例

#### 案例 1: Calico 节点无法启动

**现象**: `calico-node` Pod 状态 CrashLoopBackOff  
**原因**: 节点 IP 检测错误,MTU 配置不合理  
**解决**:

```bash
# 修改 Calico 配置
kubectl patch felixconfiguration default --type=merge \
    -p '{"spec":{"ipDetectSource":"first-found","mtu":1450}}'

# 验证
kubectl exec -n kube-system calico-node-xxxxx -- calicoctl node status
```

#### 案例 2: 集群证书过期

**现象**: API Server 拒绝所有请求  
**解决**:

```bash
# 1. 临时使用 admin.conf
export KUBECONFIG=/etc/kubernetes/admin.conf

# 2. 备份
sudo cp -r /etc/kubernetes/pki /etc/kubernetes/pki.bak

# 3. 续期
sudo kubeadm certs renew all

# 4. 重启
sudo systemctl restart kubelet
for i in kube-apiserver kube-controller-manager kube-scheduler etcd; do
    sudo systemctl restart $i
done

# 5. 验证
sudo kubeadm certs check-expiration
```

#### 案例 3: 节点 CPU 抢占导致 Pod 频繁重启

**现象**: 在线推理 Pod 频繁 OOMKilled  
**解决**:

```yaml
resources:
  requests:
    cpu: "2"
    memory: 4Gi
  limits:
    cpu: "4"
    memory: 8Gi
```

同时配置 QoS 为 Guaranteed。

---

## 第 5 章 回滚机制

### 5.1 完整回滚流程

```bash
#!/bin/bash
# rollback.sh - ZS-AI-Platform K8s 集群回滚脚本

set -euo pipefail

# 配置
BACKUP_DIR="/backup/k8s/$(date +%Y%m%d)"
ETCD_SNAPSHOT="$BACKUP_DIR/etcd-snapshot.db"
K8S_VERSION_TARGET="v1.30.0"

log_info() { echo -e "\033[0;34m[INFO]\033[0m $*"; }
log_warn() { echo -e "\033[0;33m[WARN]\033[0m $*"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $*"; }

# 1. 集群状态快照
log_info "步骤 1: 采集集群当前状态..."
kubectl get all -A -o yaml > $BACKUP_DIR/all-resources.yaml
kubectl get nodes -o yaml > $BACKUP_DIR/nodes.yaml
kubectl get cm,secret -A -o yaml > $BACKUP_DIR/configs.yaml

# 2. 备份 etcd
log_info "步骤 2: 备份 etcd 数据..."
sudo ETCDCTL_API=3 etcdctl snapshot save $ETCD_SNAPSHOT \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key

# 3. 确认回滚范围
echo "请选择回滚范围:"
echo "1. 完整集群回滚 (危险)"
echo "2. 单组件回滚 (Helm release)"
echo "3. 节点级回滚"
read -p "请输入 [1-3]: " choice

case $choice in
    1) full_cluster_rollback ;;
    2) component_rollback ;;
    3) node_rollback ;;
    *) log_error "无效选择" && exit 1 ;;
esac
```

### 5.2 节点级回滚

#### 5.2.1 移除节点

```bash
# 1. 驱逐 Pod
kubectl drain k8s-worker-01 --ignore-daemonsets --delete-emptydir-data --force

# 2. 删除节点
kubectl delete node k8s-worker-01

# 3. 重置 kubeadm
sudo kubeadm reset -f
sudo rm -rf /var/lib/etcd
sudo rm -rf /var/lib/kubelet
sudo rm -rf /etc/cni/net.d
sudo rm -rf /var/lib/containerd
sudo systemctl restart containerd
sudo systemctl restart kubelet

# 4. 重新加入集群
sudo kubeadm join k8s-lb-vip:6443 --token xxx --discovery-token-ca-cert-hash sha256:xxx
```

#### 5.2.2 替换故障节点

```bash
# 1. 标记为不可调度
kubectl cordon k8s-worker-01

# 2. 驱逐所有 Pod
kubectl drain k8s-worker-01 --ignore-daemonsets --delete-emptydir-data --force

# 3. 下线节点
kubectl delete node k8s-worker-01

# 4. 新节点加入
# 在新节点上执行 kubeadm join
```

### 5.3 应用级回滚 (Helm)

```bash
# 1. 查看历史
helm history <release-name> -n <namespace>

# 2. 回滚到上一版本
helm rollback <release-name> -n <namespace>

# 3. 回滚到指定版本
helm rollback <release-name> <revision> -n <namespace>

# 4. 验证
helm list -n <namespace>
kubectl get pods -n <namespace>

# 5. 例子:回滚 ArgoCD
helm history argocd -n argocd
helm rollback argocd 3 -n argocd
```

### 5.4 数据级回滚 (etcd)

```bash
#!/bin/bash
# etcd-restore.sh

set -euo pipefail

SNAPSHOT=$1
ETCD_NAME=$(hostname)
INITIAL_CLUSTER="k8s-master-01=https://192.168.10.11:2380,k8s-master-02=https://192.168.10.12:2380,k8s-master-03=https://192.168.10.13:2380"

# 1. 停止所有 Master 的 kube-apiserver
for node in k8s-master-01 k8s-master-02 k8s-master-03; do
    ssh $node "sudo systemctl stop kube-apiserver"
done

# 2. 停止 etcd
for node in k8s-master-01 k8s-master-02 k8s-master-03; do
    ssh $node "sudo systemctl stop etcd"
done

# 3. 备份当前数据
for node in k8s-master-01 k8s-master-02 k8s-master-03; do
    ssh $node "sudo mv /var/lib/etcd /var/lib/etcd.bak.$(date +%Y%m%d)"
done

# 4. 恢复快照
for node in k8s-master-01 k8s-master-02 k8s-master-03; do
    ssh $node "sudo ETCDCTL_API=3 etcdctl snapshot restore $SNAPSHOT \
        --data-dir=/var/lib/etcd \
        --name=$node \
        --initial-cluster=$INITIAL_CLUSTER \
        --initial-advertise-peer-urls=https://${node#k8s-}:2380"
done

# 5. 启动 etcd
for node in k8s-master-01 k8s-master-02 k8s-master-03; do
    ssh $node "sudo systemctl start etcd"
done

# 6. 启动 kube-apiserver
for node in k8s-master-01 k8s-master-02 k8s-master-03; do
    ssh $node "sudo systemctl start kube-apiserver"
done

# 7. 验证
kubectl get nodes
kubectl get pods -A
```

### 5.5 灾难恢复 (异地重建)

```bash
# 1. 在灾备环境准备新节点 (5.1.1 - 5.1.10 全部检查)
# 2. 安装 kubeadm/kubelet/kubectl (同 2.4)
# 3. 拉取 etcd 快照到新 Master
# 4. 恢复 etcd
# 5. 启动集群
# 6. 修改 load balancer 指向新集群
# 7. DNS 切换

# 关键文件
# - /etc/kubernetes/pki/ (证书)
# - /etc/kubernetes/manifests/ (静态 Pod)
# - /var/lib/etcd/ (数据)
# - /var/lib/kubelet/ (节点配置)
# - /etc/cni/net.d/ (网络配置)
```

### 5.6 备份策略

```bash
# 0 0 * * * /usr/local/bin/etcd-backup.sh
cat > /usr/local/bin/etcd-backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup/etcd/$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
ETCDCTL_API=3 etcdctl snapshot save $BACKUP_DIR/etcd-snapshot.db \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key

# 上传到 S3/OSS
aws s3 cp $BACKUP_DIR/etcd-snapshot.db s3://zs-ai-backup/etcd/$(date +%Y%m%d)/

# 保留 30 天
find /backup/etcd/ -mtime +30 -delete
EOF
chmod +x /usr/local/bin/etcd-backup.sh
```

---

## 第 6 章 验证标准

### 6.1 50+ 验收检查项

#### 6.1.1 基础设施 (10 项)

| 序号 | 检查项 | 命令 | 通过标准 | 状态 |
|------|--------|------|----------|------|
| 1 | 所有节点时间同步 | `chronyc tracking` | 偏差 < 100ms | ☐ |
| 2 | NTP 服务运行 | `systemctl status chrony` | active (running) | ☐ |
| 3 | swap 已关闭 | `swapon --show` | 无输出 | ☐ |
| 4 | 内核模块加载 | `lsmod \| grep br_netfilter` | 已加载 | ☐ |
| 5 | IP 转发开启 | `cat /proc/sys/net/ipv4/ip_forward` | = 1 | ☐ |
| 6 | 桥接流量处理 | `cat /proc/sys/net/bridge/bridge-nf-call-iptables` | = 1 | ☐ |
| 7 | 文件描述符 | `ulimit -n` | ≥ 1048576 | ☐ |
| 8 | 磁盘空间 | `df -h /var/lib/containerd` | 使用率 < 80% | ☐ |
| 9 | 内存充足 | `free -h` | 可用 > 20% | ☐ |
| 10 | 防火墙规则 | `ufw status` | 必要端口已放行 | ☐ |

#### 6.1.2 集群组件 (15 项)

| 序号 | 检查项 | 命令 | 通过标准 | 状态 |
|------|--------|------|----------|------|
| 11 | API Server 健康 | `kubectl get --raw='/healthz'` | ok | ☐ |
| 12 | 所有节点 Ready | `kubectl get nodes` | 3 Master + 3 Worker Ready | ☐ |
| 13 | etcd 健康 | `etcdctl endpoint health` | 所有 member healthy | ☐ |
| 14 | CoreDNS 运行 | `kubectl get pods -n kube-system -l k8s-app=kube-dns` | 2/2 Running | ☐ |
| 15 | Calico 运行 | `kubectl get pods -n kube-system -l k8s-app=calico-node` | 所有节点 Running | ☐ |
| 16 | kube-proxy 运行 | `kubectl get pods -n kube-system -l k8s-app=kube-proxy` | 所有节点 Running | ☐ |
| 17 | metrics-server 运行 | `kubectl top nodes` | 正常输出 | ☐ |
| 18 | Ingress Controller | `kubectl get pods -n ingress-nginx` | Running | ☐ |
| 19 | cert-manager | `kubectl get clusterissuers` | Ready | ☐ |
| 20 | StorageClass | `kubectl get sc` | 至少 1 个默认 | ☐ |
| 21 | MetalLB (如使用) | `kubectl get pods -n metallb-system` | Running | ☐ |
| 22 | Pod 网络互通 | `kubectl exec -it pod-a -- ping pod-b-ip` | 正常 | ☐ |
| 23 | Service 网络 | `kubectl exec -it pod-a -- nslookup kubernetes` | 正常解析 | ☐ |
| 24 | 节点出网 | `kubectl exec -it pod-a -- curl 8.8.8.8` | 正常 | ☐ |
| 25 | HPA 可用 | `kubectl get hpa` | 状态正常 | ☐ |

#### 6.1.3 业务组件 (10 项)

| 序号 | 检查项 | 命令 | 通过标准 | 状态 |
|------|--------|------|----------|------|
| 26 | ArgoCD 运行 | `kubectl get pods -n argocd` | Running | ☐ |
| 27 | Prometheus 运行 | `kubectl get pods -n monitoring` | Running | ☐ |
| 28 | Grafana 可访问 | `curl -I http://grafana.local` | 200 | ☐ |
| 29 | Loki 运行 | `kubectl get pods -n logging` | Running | ☐ |
| 30 | Harbor 可访问 | `curl -I https://harbor.local` | 200 | ☐ |
| 31 | 镜像可推送 | `docker push harbor.local/test:latest` | 成功 | ☐ |
| 32 | 镜像可拉取 | 在集群中创建 Pod 拉取 | 成功 | ☐ |
| 33 | 告警规则 | `kubectl get prometheusrules` | ≥ 5 个 | ☐ |
| 34 | Dashboard 数量 | `kubectl get cm -A \| grep dashboard` | ≥ 10 | ☐ |
| 35 | 日志收集 | `kubectl logs -l app=test` | 有日志输出 | ☐ |

#### 6.1.4 安全基线 (15 项)

| 序号 | 检查项 | 命令 | 通过标准 | 状态 |
|------|--------|------|----------|------|
| 36 | 证书未过期 | `kubeadm certs check-expiration` | 全部 ≥ 30 天 | ☐ |
| 37 | API Server 审计 | `kubectl get pods -n kube-system \| grep audit` | 已启用 | ☐ |
| 38 | Pod Security | `kubectl get ns -o yaml \| grep pod-security` | restricted 标签 | ☐ |
| 39 | Network Policy | `kubectl get networkpolicy -A` | ≥ 3 个 | ☐ |
| 40 | RBAC 配置 | `kubectl get clusterrolebindings` | 最小权限 | ☐ |
| 41 | 默认 Service Account | `kubectl get sa default -o yaml` | automountServiceAccountToken: false | ☐ |
| 42 | 镜像来源 | `kubectl get pods -A -o json \| jq '.items[].spec.containers[].image'` | 无 latest 标签 | ☐ |
| 43 | 密钥管理 | `kubectl get secrets -A` | 使用 External Secrets | ☐ |
| 44 | 容器以非 root 运行 | `kubectl get pods -A -o yaml \| grep runAsNonRoot` | true | ☐ |
| 45 | 只读根文件系统 | `kubectl get pods -A -o yaml \| grep readOnlyRootFilesystem` | true | ☐ |
| 46 | 资源限制 | `kubectl get pods -A -o yaml \| grep limits` | 全部设置 | ☐ |
| 47 | 主机网络 | `kubectl get pods -A -o yaml \| grep hostNetwork` | 最小化 | ☐ |
| 48 | 特权容器 | `kubectl get pods -A -o yaml \| grep privileged` | 无 | ☐ |
| 49 | etcd 加密 | `ps aux \| grep etcd \| grep encrypt` | 启用 | ☐ |
| 50 | 网络加密 | WireGuard/IPsec | 启用 | ☐ |

### 6.2 自动化验证脚本

参见 `verify-k8s-cluster.sh` 文件。

### 6.3 性能基线测试

```bash
# 网络性能
iperf3 -c <target-ip> -t 60 -P 8

# 存储性能
fio --name=write --ioengine=libaio --direct=1 --bs=4k --size=1G --rw=randwrite --filename=/var/lib/containerd/test.fio
fio --name=read --ioengine=libaio --direct=1 --bs=4k --size=1G --rw=randread --filename=/var/lib/containerd/test.fio

# 集群性能:Pod 启动时间
time kubectl run test --image=busybox --rm -it --restart=Never -- echo "hello"

# 集群性能:网络延迟
kubectl run nettest --image=alpine --rm -it --restart=Never -- ping -c 10 <pod-ip>

# 集群性能:服务发现
time kubectl run test --image=busybox --rm -it --restart=Never -- nslookup kubernetes.default
```

### 6.4 安全基线检查

```bash
# 安装 kube-bench
curl -L -o /usr/local/bin/kube-bench.tar.gz https://github.com/aquasecurity/kube-bench/releases/download/v0.10.4/kube-bench_0.10.4_linux_amd64.tar.gz
tar -xvf /usr/local/bin/kube-bench.tar.gz -C /usr/local/bin/

# 执行检查
kube-bench run --targets=master,node,etcd,policies --json > /tmp/kube-bench.json

# 查看结果
cat /tmp/kube-bench.json | jq '.Controls[].results' | head -100

# 通过标准:WARN ≤ 5,FAIL = 0
```

---

## 第 7 章 运维手册

### 7.1 日常巡检

#### 7.1.1 每日巡检清单

```bash
#!/bin/bash
# daily-check.sh - 每日巡检脚本

# 1. 节点状态
echo "=== 节点状态 ==="
kubectl get nodes
kubectl get nodes -o json | jq '.items[].status.conditions[] | select(.type=="Ready") | {node: .message, status: .status}'

# 2. 集群组件
echo "=== 系统组件 ==="
kubectl get pods -n kube-system | grep -v Running

# 3. 资源使用
echo "=== 资源使用 TOP 10 ==="
kubectl top nodes
kubectl top pods -A --sort-by=memory | head -20

# 4. 事件
echo "=== 异常事件 ==="
kubectl get events -A --field-selector type=Warning --sort-by='.lastTimestamp' | head -20

# 5. 存储
echo "=== 存储使用 ==="
kubectl get pvc -A
df -h | grep -v tmpfs | head -20

# 6. 网络
echo "=== 网络 ==="
calicoctl node status
cilium status 2>/dev/null

# 7. 证书
echo "=== 证书 ==="
kubeadm certs check-expiration 2>/dev/null

# 8. 备份
echo "=== 备份 ==="
ls -lah /backup/etcd/ | tail -5

# 9. 升级检查
echo "=== 升级 ==="
kubectl version
kubeadm upgrade plan 2>/dev/null | head -20
```

#### 7.1.2 每周巡检

```bash
# 1. 安全扫描
trivy image --severity HIGH,CRITICAL nginx:latest
kube-bench run

# 2. 性能基线
iperf3 -c <target>
fio --name=test --ioengine=libaio --direct=1 --bs=4k --size=1G --rw=randread --filename=/var/lib/containerd/test.fio

# 3. 日志审查
grep -i "error\|panic\|fatal" /var/log/pods/*/*/*.log | head -50

# 4. 容量预测
kubectl get nodes -o json | jq '.items[].status.allocatable'
```

### 7.2 备份恢复

参见 [5.6 备份策略](#56-备份策略)。

### 7.3 升级流程

#### 7.3.1 K8s 版本升级 (1.30 → 1.31)

```bash
# 1. 升级 kubeadm
sudo apt-get update
sudo apt-get install -y kubeadm=1.31.0-*

# 2. drain master
kubectl drain k8s-master-01 --ignore-daemonsets

# 3. 升级
sudo kubeadm upgrade apply v1.31.0

# 4. 升级 kubelet/kubectl
sudo apt-get install -y kubelet=1.31.0-* kubectl=1.31.0-*
sudo systemctl daemon-reload
sudo systemctl restart kubelet

# 5. uncordon
kubectl uncordon k8s-master-01

# 6. 升级其他 Master
# 7. 升级 Worker (重复 2-5)
```

#### 7.3.2 组件升级

```bash
# Helm 升级
helm upgrade <release> <chart> -n <namespace> -f values.yaml

# ArgoCD 升级
helm upgrade argocd argo/argo-cd -n argocd

# cert-manager 升级
helm upgrade cert-manager jetstack/cert-manager -n cert-manager
```

### 7.4 扩缩容操作

#### 7.4.1 节点扩容

```bash
# 1. 新节点初始化 (5.1 步骤)
# 2. 加入集群
sudo kubeadm join k8s-lb-vip:6443 --token xxx --discovery-token-ca-cert-hash sha256:xxx
# 3. 打标签
kubectl label node <new-node> node-role.kubernetes.io/worker=true workload=general
```

#### 7.4.2 应用扩容

```bash
# 1. HPA 自动扩缩
kubectl autoscale deployment <name> --cpu-percent=70 --min=2 --max=10 -n <namespace>

# 2. 手动扩容
kubectl scale deployment <name> --replicas=5 -n <namespace>

# 3. 节点级 HPA
# Cluster Autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
    --namespace kube-system \
    --set autoDiscovery.clusterName=<cluster-name> \
    --set awsRegion=cn-shanghai
```

#### 7.4.3 缩容

```bash
# 1. drain 节点
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 2. 删除节点
kubectl delete node <node-name>

# 3. 重置
sudo kubeadm reset
```

### 7.5 监控告警

#### 7.5.1 关键告警规则

```yaml
# 高 CPU 使用
- alert: HighCPUUsage
  expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage on {{ $labels.instance }}"

# 高内存使用
- alert: HighMemoryUsage
  expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High memory usage on {{ $labels.instance }}"

# 磁盘空间
- alert: DiskSpaceRunningOut
  expr: (1 - (node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"})) * 100 > 85
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Disk running out on {{ $labels.instance }}"

# Pod 频繁重启
- alert: PodCrashLooping
  expr: rate(kube_pod_container_status_restarts_total[10m]) * 60 > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Pod {{ $labels.pod }} is crash looping"

# 节点 NotReady
- alert: NodeNotReady
  expr: kube_node_status_condition{condition="Ready",status="true"} == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Node {{ $labels.node }} is not ready"

# etcd 成员不可用
- alert: EtcdMemberDown
  expr: up{job="etcd"} == 0
  for: 3m
  labels:
    severity: critical
  annotations:
    summary: "etcd member {{ $labels.instance }} is down"

# API Server 不可用
- alert: APIServerDown
  expr: up{job="apiserver"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "API Server is down"
```

#### 7.5.2 告警接收

```bash
# Alertmanager 配置
cat > alertmanager-config.yaml <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'smtp.feishu.cn:465'
      smtp_from: 'alert@zs-ai-platform.com'
      smtp_auth_username: 'alert@zs-ai-platform.com'
      smtp_auth_password: 'xxx'
    route:
      group_by: ['alertname', 'cluster']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      receiver: 'feishu'
    receivers:
    - name: 'feishu'
      webhook_configs:
      - url: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx'
    templates:
    - '/etc/alertmanager-templates/*.tmpl'
EOF
```

### 7.6 应急响应

#### 7.6.1 应急响应流程

```
1. 告警触发
   ↓
2. 值班 SRE 接收 (1 分钟内)
   ↓
3. 初步判断 (5 分钟内)
   - 严重级别: P0/P1/P2/P3
   - 影响范围: 单节点/单 Pod/全集群
   ↓
4. 应急小组组建
   - P0: 全员 + Leader
   - P1: Leader + 值班
   - P2: 值班
   ↓
5. 处置 (按预案)
   ↓
6. 复盘 (24h 内)
```

#### 7.6.2 常见应急操作

```bash
# 1. 单 Pod 异常
kubectl delete pod <pod-name> -n <namespace>

# 2. Deployment 异常
kubectl rollout undo deployment/<name> -n <namespace>

# 3. StatefulSet 异常
kubectl rollout status statefulset/<name> -n <namespace>

# 4. 节点异常
kubectl cordon <node>
kubectl drain <node>

# 5. 紧急扩容
kubectl scale deployment <name> --replicas=20 -n <namespace>

# 6. 紧急限制流量
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF

# 7. 紧急回滚
helm rollback <release> 1 -n <namespace>
```

---

## 附录 A 命令速查

```bash
# 节点
kubectl get nodes
kubectl describe node <name>
kubectl cordon <name>
kubectl uncordon <name>
kubectl drain <name>
kubectl top node

# Pod
kubectl get pods -A
kubectl describe pod <name> -n <ns>
kubectl logs <pod> -n <ns> -f
kubectl exec -it <pod> -n <ns> -- /bin/bash
kubectl delete pod <pod> -n <ns>
kubectl get pod -o wide
kubectl get pod -o yaml

# Service
kubectl get svc -A
kubectl get endpoints

# Deployment
kubectl get deploy -A
kubectl scale deploy <name> --replicas=5 -n <ns>
kubectl rollout status deploy/<name> -n <ns>
kubectl rollout undo deploy/<name> -n <ns>
kubectl rollout history deploy/<name> -n <ns>

# ConfigMap / Secret
kubectl get cm -A
kubectl get secret -A
kubectl create cm <name> --from-file=xxx -n <ns>
kubectl create secret generic <name> --from-literal=key=value -n <ns>

# Storage
kubectl get pvc,pv -A
kubectl get sc
kubectl describe pvc <name> -n <ns>

# Network
kubectl get netpol -A
kubectl get ingress -A
kubectl get endpoints

# RBAC
kubectl get sa,role,rolebinding,clusterrole,clusterrolebinding -A
kubectl auth can-i <verb> <resource> --as=<user>

# 集群
kubectl cluster-info
kubectl api-resources
kubectl api-versions
kubectl get events -A
kubectl get --raw='/healthz'
kubectl get --raw='/livez'
kubectl get --raw='/readyz'

# 上下文
kubectl config get-contexts
kubectl config use-context <name>
kubectl config set-context --current --namespace=<ns>

# 调试
kubectl run debug --image=busybox --rm -it --restart=Never -- sh
kubectl debug <pod> -n <ns> --image=busybox --target=<container>
```

## 附录 B 参考链接

- [Kubernetes 官方文档](https://kubernetes.io/zh-cn/docs/)
- [kubeadm 安装指南](https://kubernetes.io/zh-cn/docs/setup/production-environment/tools/kubeadm/)
- [Calico 网络插件](https://docs.tigera.io/calico/latest/about)
- [Helm 包管理](https://helm.sh/zh/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [cert-manager 文档](https://cert-manager.io/docs/)
- [ArgoCD 文档](https://argo-cd.readthedocs.io/)
- [kube-bench 安全基线](https://github.com/aquasecurity/kube-bench)
- [trivy 漏洞扫描](https://trivy.dev/)

---

**文档结束**

如有疑问请联系: SRE 团队 (sre@zs-ai-platform.com)
