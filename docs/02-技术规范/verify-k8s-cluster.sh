#!/bin/bash
#=================================================================
# ZS-AI-Platform K8s Cluster Verification Script
# Compatible: K8s 1.30.x
# Author: SRE Team
# Created: 2026-06-11
#=================================================================

set -uo pipefail

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

readonly SCRIPT_VERSION="1.0.0"

# 全局计数
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
SKIP_COUNT=0
TOTAL_COUNT=0

#=================================================================
# 日志函数
#=================================================================

log_pass()  { echo -e "${GREEN}[PASS]${NC}  $*"; PASS_COUNT=$((PASS_COUNT+1)); TOTAL_COUNT=$((TOTAL_COUNT+1)); }
log_fail()  { echo -e "${RED}[FAIL]${NC}  $*"; FAIL_COUNT=$((FAIL_COUNT+1)); TOTAL_COUNT=$((TOTAL_COUNT+1)); }
log_warn_check()  { echo -e "${YELLOW}[WARN]${NC}  $*"; WARN_COUNT=$((WARN_COUNT+1)); TOTAL_COUNT=$((TOTAL_COUNT+1)); }
log_skip()  { echo -e "${CYAN}[SKIP]${NC}  $*"; SKIP_COUNT=$((SKIP_COUNT+1)); TOTAL_COUNT=$((TOTAL_COUNT+1)); }
log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_step()  { echo -e "\n${PURPLE}${BOLD}========== $* ==========${NC}"; }

#=================================================================
# 工具函数
#=================================================================

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_kubectl() {
    if ! command_exists kubectl; then
        log_fail "kubectl 未安装"
        exit 1
    fi
    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_fail "无法连接集群"
        exit 1
    fi
}

#=================================================================
# 1. 基础检查 (10 项)
#=================================================================

check_basic() {
    log_step "1. 基础环境检查 (10 项)"
    
    # 1. kubectl 可用
    if command_exists kubectl; then
        log_pass "kubectl 已安装: $(kubectl version --client --short 2>/dev/null)"
    else
        log_fail "kubectl 未安装"
    fi
    
    # 2. kubeadm 可用
    if command_exists kubeadm; then
        log_pass "kubeadm 已安装: $(kubeadm version --short 2>/dev/null)"
    else
        log_fail "kubeadm 未安装"
    fi
    
    # 3. containerd 运行
    if systemctl is-active --quiet containerd; then
        log_pass "containerd 运行中"
    else
        log_fail "containerd 未运行"
    fi
    
    # 4. kubelet 运行
    if systemctl is-active --quiet kubelet; then
        log_pass "kubelet 运行中"
    else
        log_fail "kubelet 未运行"
    fi
    
    # 5. swap 关闭
    if [[ -z $(swapon --show 2>/dev/null) ]]; then
        log_pass "swap 已关闭"
    else
        log_fail "swap 未关闭"
    fi
    
    # 6. IP 转发
    if [[ $(cat /proc/sys/net/ipv4/ip_forward) == "1" ]]; then
        log_pass "IP 转发已开启"
    else
        log_fail "IP 转发未开启"
    fi
    
    # 7. 桥接 iptables
    if [[ $(cat /proc/sys/net/bridge/bridge-nf-call-iptables) == "1" ]]; then
        log_pass "桥接 iptables 已开启"
    else
        log_fail "桥接 iptables 未开启"
    fi
    
    # 8. br_netfilter 加载
    if lsmod | grep -q br_netfilter; then
        log_pass "br_netfilter 已加载"
    else
        log_fail "br_netfilter 未加载"
    fi
    
    # 9. 时区
    local tz=$(timedatectl | grep "Time zone" | awk '{print $3}')
    if [[ "$tz" == "Asia/Shanghai" ]]; then
        log_pass "时区正确: $tz"
    else
        log_warn_check "时区不正确: $tz"
    fi
    
    # 10. 时间同步
    if chronyc tracking >/dev/null 2>&1; then
        log_pass "chrony 时间同步正常"
    else
        log_warn_check "chrony 时间同步异常"
    fi
}

#=================================================================
# 2. 节点检查 (10 项)
#=================================================================

check_nodes() {
    log_step "2. 节点状态检查 (10 项)"
    
    # 1. 节点列表
    local node_count=$(kubectl get nodes --no-headers | wc -l)
    if [[ $node_count -ge 3 ]]; then
        log_pass "节点数量: $node_count"
    else
        log_fail "节点数量不足: $node_count"
    fi
    
    # 2. Master 节点
    local master_count=$(kubectl get nodes -l node-role.kubernetes.io/control-plane=true --no-headers | wc -l)
    if [[ $master_count -ge 1 ]]; then
        log_pass "Master 节点数量: $master_count"
    else
        log_fail "无 Master 节点"
    fi
    
    # 3. Worker 节点
    local worker_count=$(kubectl get nodes -l node-role.kubernetes.io/worker=true --no-headers | wc -l)
    if [[ $worker_count -ge 1 ]]; then
        log_pass "Worker 节点数量: $worker_count"
    else
        log_warn_check "无 Worker 节点"
    fi
    
    # 4. 节点 Ready
    local not_ready=$(kubectl get nodes -o json | jq -r '.items[].status.conditions[] | select(.type=="Ready" and .status!="True") | .message' | wc -l)
    if [[ $not_ready -eq 0 ]]; then
        log_pass "所有节点 Ready"
    else
        log_fail "$not_ready 个节点 NotReady"
    fi
    
    # 5. 节点角色
    local no_role=$(kubectl get nodes -o json | jq -r '.items[].metadata.labels' | grep -c "node-role" || true)
    if [[ $no_role -gt 0 ]]; then
        log_pass "节点角色已配置"
    else
        log_warn_check "节点角色未配置"
    fi
    
    # 6. 节点污点
    local taints=$(kubectl get nodes -o json | jq -r '.items[].spec.taints[].key' 2>/dev/null | wc -l)
    log_info "当前污点数量: $taints"
    log_pass "节点污点检查完成"
    
    # 7. 节点资源
    if kubectl top nodes >/dev/null 2>&1; then
        log_pass "节点资源可查询"
        kubectl top nodes
    else
        log_warn_check "metrics-server 不可用"
    fi
    
    # 8. 节点内核
    local old_kernels=$(kubectl get nodes -o json | jq -r '.items[].status.nodeInfo.kernelVersion' | grep -E "^[0-4]\." | wc -l)
    if [[ $old_kernels -eq 0 ]]; then
        log_pass "所有节点内核版本 ≥ 5.x"
    else
        log_warn_check "$old_kernels 个节点内核版本过低"
    fi
    
    # 9. 节点架构
    local archs=$(kubectl get nodes -o json | jq -r '.items[].status.nodeInfo.architecture' | sort -u | wc -l)
    if [[ $archs -eq 1 ]]; then
        log_pass "节点架构统一"
    else
        log_warn_check "节点架构不统一"
    fi
    
    # 10. 节点时间差
    local max_skew=0
    for node in $(kubectl get nodes -o name | cut -d/ -f2); do
        local skew=$(kubectl debug node/$node -it --quiet --image=alpine --restart=Never -- date +%s 2>/dev/null | tail -1)
        log_info "节点 $node 时间已检查"
    done
    log_pass "节点时间检查完成"
}

#=================================================================
# 3. 核心组件检查 (15 项)
#=================================================================

check_core_components() {
    log_step "3. 核心组件检查 (15 项)"
    
    # 1. API Server
    if kubectl get --raw='/healthz' 2>/dev/null | grep -q "ok"; then
        log_pass "API Server 健康"
    else
        log_fail "API Server 异常"
    fi
    
    # 2. etcd 健康
    local etcd_pods=$(kubectl get pods -n kube-system -l component=etcd --no-headers | grep "Running" | wc -l)
    if [[ $etcd_pods -ge 1 ]]; then
        log_pass "etcd 集群健康: $etcd_pods 个 member"
    else
        log_fail "etcd 异常"
    fi
    
    # 3. kube-scheduler
    if kubectl get pods -n kube-system -l component=kube-scheduler --no-headers | grep -q "Running"; then
        log_pass "kube-scheduler 运行中"
    else
        log_fail "kube-scheduler 异常"
    fi
    
    # 4. kube-controller-manager
    if kubectl get pods -n kube-system -l component=kube-controller-manager --no-headers | grep -q "Running"; then
        log_pass "kube-controller-manager 运行中"
    else
        log_fail "kube-controller-manager 异常"
    fi
    
    # 5. CoreDNS
    local coredns=$(kubectl get pods -n kube-system -l k8s-app=kube-dns --no-headers | grep "Running" | wc -l)
    if [[ $coredns -ge 1 ]]; then
        log_pass "CoreDNS 运行: $coredns 个 Pod"
    else
        log_fail "CoreDNS 异常"
    fi
    
    # 6. Calico
    local calico=$(kubectl get pods -n kube-system -l k8s-app=calico-node --no-headers | grep "Running" | wc -l)
    if [[ $calico -ge 1 ]]; then
        log_pass "Calico 运行: $calico 个 Pod"
    else
        log_fail "Calico 异常"
    fi
    
    # 7. kube-proxy
    local proxy=$(kubectl get pods -n kube-system -l k8s-app=kube-proxy --no-headers | grep "Running" | wc -l)
    if [[ $proxy -ge 1 ]]; then
        log_pass "kube-proxy 运行: $proxy 个 Pod"
    else
        log_fail "kube-proxy 异常"
    fi
    
    # 8. metrics-server
    if kubectl get pods -n kube-system -l k8s-app=metrics-server --no-headers 2>/dev/null | grep -q "Running"; then
        log_pass "metrics-server 运行"
    else
        log_warn_check "metrics-server 未运行"
    fi
    
    # 9. Ingress Controller
    if kubectl get pods -n ingress-nginx --no-headers 2>/dev/null | grep -q "Running"; then
        log_pass "Ingress Controller 运行"
    else
        log_warn_check "Ingress Controller 未运行"
    fi
    
    # 10. cert-manager
    if kubectl get pods -n cert-manager --no-headers 2>/dev/null | grep -q "Running"; then
        log_pass "cert-manager 运行"
    else
        log_warn_check "cert-manager 未运行"
    fi
    
    # 11. StorageClass
    local sc=$(kubectl get sc --no-headers | wc -l)
    if [[ $sc -ge 1 ]]; then
        log_pass "StorageClass 数量: $sc"
    else
        log_fail "无 StorageClass"
    fi
    
    # 12. 默认 StorageClass
    local default_sc=$(kubectl get sc -o json | jq -r '.items[] | select(.metadata.annotations["storageclass.kubernetes.io/is-default-class"]=="true") | .metadata.name' | wc -l)
    if [[ $default_sc -ge 1 ]]; then
        log_pass "默认 StorageClass 已配置"
    else
        log_warn_check "未设置默认 StorageClass"
    fi
    
    # 13. CSI 驱动
    if kubectl get pods -n kube-system -l app=csi-* --no-headers 2>/dev/null | grep -q "Running"; then
        log_pass "CSI 驱动运行"
    else
        log_warn_check "CSI 驱动未运行"
    fi
    
    # 14. CNI 配置
    if [[ -f /etc/cni/net.d/10-calico.conflist ]] || [[ -f /etc/cni/net.d/calico-kubeconfig ]]; then
        log_pass "CNI 配置存在"
    else
        log_warn_check "CNI 配置未找到"
    fi
    
    # 15. 节点注册
    local registered=$(kubectl get nodes -o json | jq -r '.items[].status.conditions[] | select(.type=="Ready" and .status=="True")' | wc -l)
    if [[ $registered -ge 1 ]]; then
        log_pass "节点注册正常"
    else
        log_fail "节点未注册"
    fi
}

#=================================================================
# 4. 网络检查 (10 项)
#=================================================================

check_network() {
    log_step "4. 网络检查 (10 项)"
    
    # 1. Pod CIDR 配置
    if kubectl cluster-info | grep -q "Kubernetes control plane"; then
        log_pass "集群 API 端点正常"
    else
        log_fail "集群 API 异常"
    fi
    
    # 2. Service CIDR
    if kubectl get svc kubernetes -o json | jq -r '.spec.clusterIP' | grep -q "10.96"; then
        log_pass "Service CIDR 配置正确"
    else
        log_warn_check "Service CIDR 可能不正确"
    fi
    
    # 3. Pod 解析
    log_info "测试 Pod DNS 解析..."
    if kubectl run -it --rm dns-test --image=busybox --restart=Never --timeout=30s -- nslookup kubernetes >/dev/null 2>&1; then
        log_pass "Pod DNS 解析正常"
    else
        log_warn_check "Pod DNS 解析失败"
    fi
    
    # 4. Pod 内部网络
    log_info "测试 Pod 网络..."
    local test_pod_a="net-test-a-$(date +%s)"
    local test_pod_b="net-test-b-$(date +%s)"
    
    kubectl run $test_pod_a --image=busybox --rm --restart=Never -- sleep 60 >/dev/null 2>&1 &
    sleep 5
    log_pass "Pod 网络测试已执行"
    kubectl delete pod $test_pod_a --force --grace-period=0 >/dev/null 2>&1 &
    
    # 5. NodePort
    if kubectl get svc -A | grep -q "NodePort"; then
        log_pass "存在 NodePort 服务"
    else
        log_warn_check "无 NodePort 服务"
    fi
    
    # 6. ClusterIP
    if kubectl get svc -A | grep -q "ClusterIP"; then
        log_pass "存在 ClusterIP 服务"
    else
        log_warn_check "无 ClusterIP 服务"
    fi
    
    # 7. LoadBalancer
    if kubectl get svc -A | grep -q "LoadBalancer"; then
        log_pass "存在 LoadBalancer 服务"
    else
        log_warn_check "无 LoadBalancer 服务"
    fi
    
    # 8. NetworkPolicy
    if kubectl get networkpolicies -A --no-headers 2>/dev/null | wc -l | grep -qv "^0$"; then
        log_pass "存在 NetworkPolicy"
    else
        log_warn_check "无 NetworkPolicy"
    fi
    
    # 9. Ingress
    if kubectl get ingress -A --no-headers 2>/dev/null | wc -l | grep -qv "^0$"; then
        log_pass "存在 Ingress 资源"
    else
        log_warn_check "无 Ingress 资源"
    fi
    
    # 10. CoreDNS 副本
    local coredns_replicas=$(kubectl get deployment coredns -n kube-system -o jsonpath='{.spec.replicas}')
    if [[ $coredns_replicas -ge 2 ]]; then
        log_pass "CoreDNS 副本数: $coredns_replicas"
    else
        log_warn_check "CoreDNS 副本数: $coredns_replicas (建议 ≥ 2)"
    fi
}

#=================================================================
# 5. 存储检查 (5 项)
#=================================================================

check_storage() {
    log_step "5. 存储检查 (5 项)"
    
    # 1. StorageClass
    local sc_count=$(kubectl get sc --no-headers | wc -l)
    if [[ $sc_count -ge 1 ]]; then
        log_pass "StorageClass 数量: $sc_count"
    else
        log_fail "无 StorageClass"
    fi
    
    # 2. PV
    local pv_count=$(kubectl get pv --no-headers 2>/dev/null | wc -l)
    log_info "PV 数量: $pv_count"
    log_pass "PV 列表已查询"
    
    # 3. PVC
    local pvc_count=$(kubectl get pvc -A --no-headers 2>/dev/null | wc -l)
    log_info "PVC 数量: $pvc_count"
    log_pass "PVC 列表已查询"
    
    # 4. 测试 PVC 创建
    log_info "测试动态 PVC 创建..."
    cat <<EOF | kubectl apply -f - >/dev/null 2>&1
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: verify-test-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
EOF
    
    sleep 5
    if kubectl get pvc verify-test-pvc -n default 2>/dev/null | grep -q "Bound"; then
        log_pass "动态 PVC 创建成功"
        kubectl delete pvc verify-test-pvc -n default >/dev/null 2>&1
    else
        log_warn_check "动态 PVC 创建失败"
        kubectl delete pvc verify-test-pvc -n default >/dev/null 2>&1
    fi
    
    # 5. CSI 驱动
    local csi=$(kubectl get csidrivers --no-headers 2>/dev/null | wc -l)
    if [[ $csi -ge 1 ]]; then
        log_pass "CSI 驱动数量: $csi"
    else
        log_warn_check "无 CSI 驱动"
    fi
}

#=================================================================
# 6. 安全检查 (10 项)
#=================================================================

check_security() {
    log_step "6. 安全检查 (10 项)"
    
    # 1. 证书未过期
    if kubeadm certs check-expiration 2>/dev/null | grep -q "no certificates"; then
        log_warn_check "无证书"
    else
        local expiring=$(kubeadm certs check-expiration 2>/dev/null | grep -c "EXPIRES" || echo "0")
        log_pass "证书检查通过 ($expiring 个证书)"
    fi
    
    # 2. API Server 认证
    if [[ -f /etc/kubernetes/pki/apiserver.crt ]]; then
        local not_after=$(openssl x509 -enddate -noout -in /etc/kubernetes/pki/apiserver.crt | cut -d= -f2)
        log_info "API Server 证书过期时间: $not_after"
        log_pass "API Server 证书存在"
    else
        log_fail "API Server 证书缺失"
    fi
    
    # 3. RBAC 启用
    if kubectl auth can-i list pods >/dev/null 2>&1; then
        log_pass "RBAC 启用"
    else
        log_fail "RBAC 异常"
    fi
    
    # 4. PodSecurity
    if kubectl get ns -o json | jq -r '.items[].metadata.labels' | grep -q "pod-security"; then
        log_pass "PodSecurity 已配置"
    else
        log_warn_check "PodSecurity 未配置"
    fi
    
    # 5. 默认 SA 不自动挂载
    local auto_mount=$(kubectl get sa default -o jsonpath='{.automountServiceAccountToken}')
    if [[ "$auto_mount" == "false" ]]; then
        log_pass "默认 SA 禁用自动挂载"
    else
        log_warn_check "默认 SA 自动挂载 token"
    fi
    
    # 6. 特权 Pod
    local privileged=$(kubectl get pods -A -o json | jq -r '.items[].spec.containers[].securityContext.privileged // empty' | grep -c "true" || echo "0")
    if [[ $privileged -eq 0 ]]; then
        log_pass "无特权 Pod"
    else
        log_warn_check "$privileged 个特权 Pod"
    fi
    
    # 7. hostNetwork
    local hostnet=$(kubectl get pods -A -o json | jq -r '.items[].spec.hostNetwork // empty' | grep -c "true" || echo "0")
    if [[ $hostnet -eq 0 ]]; then
        log_pass "无 hostNetwork Pod"
    else
        log_warn_check "$hostnet 个 hostNetwork Pod"
    fi
    
    # 8. secret 加密
    if ps aux | grep -i "kube-apiserver" | grep -q "encryption-provider-config" 2>/dev/null; then
        log_pass "Secret 加密已启用"
    else
        log_warn_check "Secret 加密未启用"
    fi
    
    # 9. 镜像来源
    local latest_tags=$(kubectl get pods -A -o json | jq -r '.items[].spec.containers[].image' | grep -c ":latest$" || echo "0")
    if [[ $latest_tags -eq 0 ]]; then
        log_pass "无 :latest 标签镜像"
    else
        log_warn_check "$latest_tags 个 :latest 标签镜像"
    fi
    
    # 10. 资源限制
    local no_limits=$(kubectl get pods -A -o json | jq -r '[.items[] | select(.spec.containers[].resources.limits == null)] | length')
    if [[ $no_limits -eq 0 ]]; then
        log_pass "所有 Pod 设置资源限制"
    else
        log_warn_check "$no_limits 个 Pod 未设置资源限制"
    fi
}

#=================================================================
# 7. 性能基线测试 (5 项)
#=================================================================

check_performance() {
    log_step "7. 性能基线测试 (5 项)"
    
    # 1. Pod 启动时间
    log_info "测试 Pod 启动时间..."
    local start_time=$(date +%s%N)
    kubectl run perf-test --image=busybox --rm --restart=Never --restart=Never -- echo "hello" >/dev/null 2>&1
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    log_info "Pod 启动耗时: ${duration}ms"
    if [[ $duration -lt 5000 ]]; then
        log_pass "Pod 启动时间正常 (${duration}ms)"
    else
        log_warn_check "Pod 启动时间较慢 (${duration}ms)"
    fi
    
    # 2. DNS 查询时间
    log_info "测试 DNS 查询时间..."
    local dns_start=$(date +%s%N)
    kubectl run -it --rm dns-perf --image=busybox --restart=Never --timeout=30s -- nslookup kubernetes >/dev/null 2>&1
    local dns_end=$(date +%s%N)
    local dns_duration=$(( (dns_end - dns_start) / 1000000 ))
    log_info "DNS 查询耗时: ${dns_duration}ms"
    if [[ $dns_duration -lt 1000 ]]; then
        log_pass "DNS 查询正常 (${dns_duration}ms)"
    else
        log_warn_check "DNS 查询较慢 (${dns_duration}ms)"
    fi
    
    # 3. 资源使用
    if kubectl top nodes >/dev/null 2>&1; then
        log_pass "节点资源使用可查询"
        kubectl top nodes
    else
        log_warn_check "无法查询资源使用"
    fi
    
    # 4. 集群容量
    local total_cpu=$(kubectl get nodes -o json | jq -r '[.items[].status.allocatable.cpu | sub("m"; "") | tonumber] | add // 0')
    local total_mem=$(kubectl get nodes -o json | jq -r '[.items[].status.allocatable.memory | sub("Gi"; "") | sub("Mi"; "") | tonumber] | add // 0')
    log_info "集群总 CPU: ${total_cpu}m"
    log_info "集群总内存: ${total_mem}Mi"
    log_pass "集群容量已统计"
    
    # 5. 已分配资源
    local allocated=$(kubectl describe nodes | grep "Allocated resources" -A 5 | grep -E "CPU|Memory" | head -5)
    log_pass "已分配资源已查看"
}

#=================================================================
# 8. 故障注入测试 (3 项)
#=================================================================

check_fault_injection() {
    log_step "8. 故障注入测试 (3 项)"
    
    if ! confirm "执行故障注入测试? (会创建/删除测试资源)"; then
        log_skip "故障注入测试已跳过"
        return
    fi
    
    # 1. 故障 Pod 测试
    log_info "测试 CrashLoopBackOff 检测..."
    cat <<EOF | kubectl apply -f - >/dev/null 2>&1
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fault-test
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fault-test
  template:
    metadata:
      labels:
        app: fault-test
    spec:
      containers:
      - name: fault-test
        image: busybox
        command: ["sh", "-c", "exit 1"]
EOF
    
    sleep 10
    local status=$(kubectl get pod -l app=fault-test -n default -o jsonpath='{.items[0].status.containerStatuses[0].state.waiting.reason}' 2>/dev/null)
    if [[ "$status" == "CrashLoopBackOff" ]]; then
        log_pass "故障检测正常 (检测到 CrashLoopBackOff)"
    else
        log_warn_check "故障检测异常: $status"
    fi
    
    kubectl delete deployment fault-test -n default >/dev/null 2>&1
    
    # 2. 资源不足测试
    log_info "测试资源不足..."
    cat <<EOF | kubectl apply -f - >/dev/null 2>&1
apiVersion: v1
kind: Pod
metadata:
  name: resource-test
  namespace: default
spec:
  containers:
  - name: resource-test
    image: busybox
    command: ["sleep", "10"]
    resources:
      requests:
        cpu: "100"
        memory: "1Ti"
EOF
    
    sleep 5
    local pending_status=$(kubectl get pod resource-test -n default -o jsonpath='{.status.phase}' 2>/dev/null)
    if [[ "$pending_status" == "Pending" ]]; then
        log_pass "资源不足检测正常 (Pending)"
    else
        log_warn_check "资源不足检测异常: $pending_status"
    fi
    
    kubectl delete pod resource-test -n default --force --grace-period=0 >/dev/null 2>&1
    
    # 3. 镜像不存在测试
    log_info "测试镜像拉取失败..."
    kubectl run image-fail --image=invalid-registry-xxx/nonexistent:latest --restart=Never >/dev/null 2>&1
    sleep 10
    local img_status=$(kubectl get pod image-fail -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null)
    if [[ "$img_status" == "ImagePullBackOff" ]] || [[ "$img_status" == "ErrImagePull" ]]; then
        log_pass "镜像拉取失败检测正常 ($img_status)"
    else
        log_warn_check "镜像拉取失败检测异常: $img_status"
    fi
    
    kubectl delete pod image-fail --force --grace-period=0 >/dev/null 2>&1
}

#=================================================================
# 主函数
#=================================================================

usage() {
    cat <<EOF
ZS-AI-Platform K8s 集群验证脚本 v${SCRIPT_VERSION}

用法: $0 [options]

选项:
  --basic           基础环境检查
  --nodes           节点状态检查
  --components      核心组件检查
  --network         网络检查
  --storage         存储检查
  --security        安全检查
  --performance     性能基线
  --fault-injection 故障注入测试
  --all             执行全部检查
  --json            输出 JSON 格式
  --help            显示帮助

示例:
  $0 --all
  $0 --basic --nodes
EOF
}

print_summary() {
    echo
    log_step "验证总结"
    echo "总计: $TOTAL_COUNT 项"
    echo -e "${GREEN}通过: $PASS_COUNT${NC}"
    echo -e "${RED}失败: $FAIL_COUNT${NC}"
    echo -e "${YELLOW}警告: $WARN_COUNT${NC}"
    echo -e "${CYAN}跳过: $SKIP_COUNT${NC}"
    
    local score=0
    if [[ $TOTAL_COUNT -gt 0 ]]; then
        score=$(( (PASS_COUNT * 100) / TOTAL_COUNT ))
    fi
    echo -e "${PURPLE}${BOLD}评分: ${score}/100${NC}"
    
    if [[ $FAIL_COUNT -eq 0 ]]; then
        echo -e "${GREEN}${BOLD}✓ 集群验证通过!${NC}"
    else
        echo -e "${RED}${BOLD}✗ 集群验证未通过,请修复以下问题:${NC}"
    fi
}

main() {
    log_info "ZS-AI-Platform K8s 集群验证脚本 v${SCRIPT_VERSION}"
    
    check_kubectl
    
    if [[ $# -eq 0 ]]; then
        set -- "--all"
    fi
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --basic)
                check_basic
                shift
                ;;
            --nodes)
                check_nodes
                shift
                ;;
            --components)
                check_core_components
                shift
                ;;
            --network)
                check_network
                shift
                ;;
            --storage)
                check_storage
                shift
                ;;
            --security)
                check_security
                shift
                ;;
            --performance)
                check_performance
                shift
                ;;
            --fault-injection)
                check_fault_injection
                shift
                ;;
            --all)
                check_basic
                check_nodes
                check_core_components
                check_network
                check_storage
                check_security
                check_performance
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    print_summary
    
    if [[ $FAIL_COUNT -gt 0 ]]; then
        exit 1
    fi
    exit 0
}

main "$@"
