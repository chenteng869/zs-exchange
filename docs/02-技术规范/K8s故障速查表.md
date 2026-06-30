# K8s 故障排查速查表

> **版本**: v1.0.0  
> **适用**: Kubernetes 1.30+ / Ubuntu 22.04  
> **最后更新**: 2026-06-11  
> **维护**: SRE 平台组

---

## 1. 速查目录

- [1. 速查目录](#1-速查目录)
- [2. Pod 状态速查](#2-pod-状态速查)
- [3. 节点状态速查](#3-节点状态速查)
- [4. 网络故障速查](#4-网络故障速查)
- [5. 存储故障速查](#5-存储故障速查)
- [6. 调度故障速查](#6-调度故障速查)
- [7. 证书与认证速查](#7-证书与认证速查)
- [8. etcd 故障速查](#8-etcd-故障速查)
- [9. 资源类速查](#9-资源类速查)
- [10. 命令工具箱](#10-命令工具箱)
- [11. 真实案例库](#11-真实案例库)

---

## 2. Pod 状态速查

| 状态 | 含义 | 常见原因 | 解决命令 |
|------|------|----------|----------|
| `Pending` | 等待调度 | 资源不足/亲和性/污点 | `kubectl describe pod <name>` |
| `ContainerCreating` | 创建中 | 镜像拉取慢/CI 卡住 | `kubectl describe pod <name>` |
| `Running` | 运行中 | - | `kubectl logs <pod>` |
| `CrashLoopBackOff` | 反复崩溃 | 应用错误/配置错误 | `kubectl logs <pod> --previous` |
| `ImagePullBackOff` | 拉取失败 | 镜像不存在/凭证错误 | 检查 `imagePullSecrets` |
| `ErrImagePull` | 拉取错误 | 网络/凭证/仓库 | `crictl pull <image>` |
| `ErrImageNeverPull` | 镜像禁止拉取 | 镜像拉取策略 | 修改 `imagePullPolicy` |
| `CreateContainerError` | 创建失败 | 存储/配置 | `kubectl describe pod` |
| `InvalidImageName` | 镜像名无效 | 镜像格式错误 | 检查 `image` 字段 |
| `OOMKilled` | 内存超限 | 内存不足 | 增加 `limits.memory` |
| `Evicted` | 节点驱逐 | 资源压力 | 检查节点资源 |
| `Completed` | 已完成 | Job 正常完成 | - |
| `Error` | 错误退出 | 退出码非 0 | `kubectl logs <pod>` |
| `Init:Error` | 初始化失败 | Init 容器错误 | `kubectl logs <pod> -c <init>` |
| `Init:CrashLoopBackOff` | Init 反复崩溃 | 初始化容器问题 | `kubectl logs <pod> -c <init>` |
| `PodInitializing` | 初始化中 | 等待 Init 完成 | 等待 |
| `Terminating` | 终止中 | 优雅停止中 | 等待或 `force delete` |
| `Unknown` | 未知状态 | kubelet 失联 | 检查 `kubectl get nodes` |

---

## 3. 节点状态速查

| 状态 | 含义 | 排查方向 | 解决命令 |
|------|------|----------|----------|
| `Ready` | 健康 | - | - |
| `NotReady` | 异常 | kubelet/CNI/磁盘 | `journalctl -u kubelet` |
| `SchedulingDisabled` | 不可调度 | 已被 cordon | `kubectl uncordon <node>` |
| `OutOfDisk` | 磁盘满 | 磁盘清理 | `df -h` 清理 |
| `MemoryPressure` | 内存压力 | 内存不足 | 扩容或缩 Pod |
| `DiskPressure` | 磁盘压力 | 磁盘不足 | 清理或扩容 |
| `PIDPressure` | PID 不足 | 进程过多 | 清理进程 |
| `NetworkUnavailable` | 网络不可用 | CNI 故障 | 重启 CNI |
| `KubeletStopped` | kubelet 停止 | 服务异常 | `systemctl restart kubelet` |

---

## 4. 网络故障速查

| 错误现象 | 可能原因 | 排查命令 | 解决方案 |
|----------|----------|----------|----------|
| Pod 之间无法通信 | CNI 故障 | `kubectl get pods -n kube-system` | 重启 calico-node |
| 同节点 Pod 通,跨节点不通 | 路由问题 | `ip route` | 检查 BGP/VXLAN |
| Service ClusterIP 不通 | kube-proxy 故障 | `kubectl logs -n kube-system kube-proxy` | 重启 kube-proxy |
| DNS 解析失败 | CoreDNS 异常 | `kubectl get pods -n kube-system -l k8s-app=kube-dns` | 重启 CoreDNS |
| 外部网络不通 | egress 策略 | `kubectl exec pod -- curl 8.8.8.8` | 检查 NetworkPolicy |
| Ingress 502 | 后端服务异常 | `kubectl describe ingress` | 检查 Service |
| Ingress 404 | 路径不匹配 | `kubectl get ingress` | 检查 path |
| NodePort 不通 | 防火墙 | `nc -zv <node-ip> <port>` | 放行端口 |
| LoadBalancer pending | 缺少 LB 控制器 | `kubectl get events` | 部署 MetalLB |
| CoreDNS 5 秒延迟 | nodelocaldns | `kubectl logs -n kube-system` | 配置 nodelocaldns |
| Calico BGP session down | 节点 IP 变化 | `calicoctl node status` | 重启 calico-node |

---

## 5. 存储故障速查

| 错误现象 | 可能原因 | 排查命令 | 解决方案 |
|----------|----------|----------|----------|
| PVC Pending | 存储类不存在 | `kubectl get sc` | 创建 StorageClass |
| PVC Pending | 容量不足 | `kubectl describe pvc` | 清理或扩容 |
| Pod VolumeMount 失败 | 存储未挂载 | `kubectl describe pod` | 检查 PVC/PV |
| MountVolume.SetUp 失败 | NFS/Ceph 故障 | `journalctl -u kubelet` | 检查存储后端 |
| Multi-Attach 错误 | 多节点挂载 | `kubectl describe pvc` | 切换为 RWO |
| ReadWriteOnce 多挂载 | PVC 已绑定 | `kubectl get pv` | 重新创建 |
| 文件系统损坏 | IO 错误 | `dmesg` | 重建存储 |
| StorageClass 无默认 | 未设置 | `kubectl get sc` | `kubectl patch sc` |
| CSI 驱动未运行 | 驱动 Pod 异常 | `kubectl get pods -n kube-system -l app=csi` | 部署 CSI |

---

## 6. 调度故障速查

| 错误现象 | 可能原因 | 排查命令 | 解决方案 |
|----------|----------|----------|----------|
| 0/N nodes are available | 资源不足 | `kubectl describe pod` | 扩容或缩资源 |
| node(s) didn't match Pod affinity | 亲和性不匹配 | `kubectl describe pod` | 调整 affinity |
| node(s) had taints | 污点不兼容 | `kubectl describe node \| grep Taints` | 设置 tolerations |
| node(s) didn't match node selector | 标签不匹配 | `kubectl get nodes --show-labels` | 添加标签 |
| persistentvolumeclaim not found | PVC 不存在 | `kubectl get pvc` | 创建 PVC |
| pod has unbound immediate PersistentVolumeClaims | PVC 未绑定 | `kubectl get pvc` | 修复 StorageClass |
| scheduler cache is corrupted | 调度器异常 | `kubectl logs -n kube-system` | 重启 scheduler |
| Invalid node name | 节点名格式 | `kubectl get nodes` | 修改节点名 |

---

## 7. 证书与认证速查

| 错误现象 | 可能原因 | 排查命令 | 解决方案 |
|----------|----------|----------|----------|
| x509: certificate has expired | 证书过期 | `kubeadm certs check-expiration` | `kubeadm certs renew all` |
| Unable to authenticate | 凭证错误 | `kubectl config view` | 更新 kubeconfig |
| Forbidden | RBAC 权限 | `kubectl auth can-i` | 修改 RoleBinding |
| Invalid API token | token 过期 | `kubectl get secrets` | 重新创建 token |
| TLS handshake timeout | 证书不匹配 | `openssl x509 -noout -text` | 重新签发 |
| 401 Unauthorized | 鉴权失败 | `kubectl auth whoami` | 检查 SA |
| 403 Forbidden | 权限不足 | `kubectl auth can-i list pods` | 授权 |
| OIDC 错误 | OIDC 配置 | `journalctl -u kube-apiserver` | 检查 OIDC |

---

## 8. etcd 故障速查

| 错误现象 | 可能原因 | 排查命令 | 解决方案 |
|----------|----------|----------|----------|
| etcd: leader election | etcd 选举失败 | `etcdctl endpoint status` | 检查网络和磁盘 |
| etcd cluster is unavailable | 多数节点故障 | `etcdctl endpoint health` | 启动备份 etcd |
| mvcc: database space exceeded | 配额满 | `etcdctl endpoint status \| grep dbSize` | `etcdctl compact` |
| WAL 损坏 | 磁盘故障 | `dmesg` | 从快照恢复 |
| etcd: request timeout | 性能问题 | `etcdctl endpoint status` | 优化 etcd 参数 |
| cluster ID mismatch | 多集群 | `etcdctl member list` | 检查配置 |

---

## 9. 资源类速查

| 错误现象 | 可能原因 | 排查命令 | 解决方案 |
|----------|----------|----------|----------|
| OOMKilled | 内存超限 | `kubectl describe pod \| grep -A 5 "Last State"` | 增加 limits |
| CPU throttled | CPU 限流 | `kubectl top pod` | 调整 limits |
| Evicted (Memory) | 内存压力 | `kubectl describe node \| grep MemoryPressure` | 扩容 |
| Evicted (Disk) | 磁盘压力 | `kubectl describe node \| grep DiskPressure` | 清理 |
| Evicted (PID) | PID 不足 | `kubectl describe node \| grep PIDPressure` | 调整 pid_max |
| Inode 不足 | 文件数过多 | `df -i` | 清理文件 |
| File descriptor 不足 | FD 耗尽 | `lsof \| wc -l` | 调整 ulimit |

---

## 10. 命令工具箱

### 10.1 集群状态

```bash
# 整体状态
kubectl get nodes
kubectl get pods -A
kubectl get svc -A
kubectl get events -A --sort-by='.lastTimestamp' | tail -50

# 详细诊断
kubectl cluster-info dump
kubectl get --raw='/healthz'
kubectl get --raw='/livez'
kubectl get --raw='/readyz'

# 资源使用
kubectl top nodes
kubectl top pods -A --sort-by=memory

# 统计
kubectl get pods -A --field-selector=status.phase!=Running
kubectl get pods -A -o json | jq '[.items[] | select(.status.containerStatuses[]?.restartCount > 5)] | length'
```

### 10.2 Pod 排查

```bash
# 基本
kubectl get pod <name> -o wide
kubectl describe pod <name>

# 日志
kubectl logs <pod> -f
kubectl logs <pod> --previous
kubectl logs <pod> -c <container>
kubectl logs <pod> --all-containers
kubectl logs <pod> --since=1h
kubectl logs <pod> --tail=100

# 进入容器
kubectl exec -it <pod> -- /bin/bash
kubectl exec -it <pod> -c <container> -- /bin/sh

# 调试
kubectl debug <pod> -it --image=busybox --target=<container>
kubectl run debug --image=busybox --rm -it --restart=Never -- sh

# 复制
kubectl cp <pod>:/path ./local-path
kubectl cp ./local-file <pod>:/path

# 端口转发
kubectl port-forward <pod> 8080:80
kubectl port-forward svc/<name> 8080:80
```

### 10.3 节点排查

```bash
# 节点信息
kubectl describe node <name>
kubectl get node <name> -o yaml
kubectl top node <name>

# 节点日志
journalctl -u kubelet -n 200 --no-pager
journalctl -u containerd -n 200 --no-pager

# 节点维护
kubectl cordon <node>
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
kubectl uncordon <node>

# 节点 SSH
ssh <node-ip> "systemctl status kubelet"
ssh <node-ip> "journalctl -u kubelet -n 100"

# 重置节点
ssh <node-ip> "kubeadm reset -f"
```

### 10.4 网络排查

```bash
# DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup kubernetes
dig @10.96.0.10 kubernetes.default.svc.cluster.local

# 连通性
kubectl exec <pod> -- ping <ip>
kubectl exec <pod> -- curl -v http://<ip>
kubectl exec <pod> -- nc -zv <ip> <port>
kubectl exec <pod> -- wget -qO- http://<ip>

# Calico
calicoctl node status
calicoctl get nodes
calicoctl get workloadEndpoints
calicoctl get bgpPeers

# 抓包
kubectl exec <pod> -- tcpdump -i any -w /tmp/cap.pcap
kubectl cp <pod>:/tmp/cap.pcap ./
```

### 10.5 存储排查

```bash
# PV/PVC
kubectl get pv,pvc -A
kubectl describe pvc <name>
kubectl describe pv <name>

# StorageClass
kubectl get sc
kubectl describe sc <name>

# 节点挂载
mount | grep <pvc-name>
lsblk

# CSI
kubectl get csinodes
kubectl get csidrivers
kubectl get pods -n kube-system -l app=csi-*
```

### 10.6 调度排查

```bash
# 调试模式
kubectl get events -A --field-selector reason=FailedScheduling

# 详细原因
kubectl describe pod <name> | grep -A 20 Events

# 模拟调度
kubectl debug node/<name> -it --image=alpine -- sh
```

### 10.7 RBAC 排查

```bash
# 检查权限
kubectl auth can-i list pods
kubectl auth can-i list pods --as=system:serviceaccount:default:default
kubectl auth can-i '*' '*' --as=system:serviceaccount:default:default -A

# 查看绑定
kubectl get rolebindings,clusterrolebindings -A
kubectl describe rolebinding <name> -n <ns>

# 审计日志
cat /var/log/kubernetes/audit/audit.log
```

### 10.8 etcd 排查

```bash
# 健康
ETCDCTL_API=3 etcdctl endpoint health \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key

# 状态
ETCDCTL_API=3 etcdctl endpoint status \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key -w table

# 成员
ETCDCTL_API=3 etcdctl member list \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key

# 告警
ETCDCTL_API=3 etcdctl alarm list \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key
```

### 10.9 API Server 排查

```bash
# API 资源
kubectl api-resources
kubectl api-versions
kubectl get --raw='/api/v1/namespaces'

# 审计
journalctl -u kube-apiserver -n 200 --no-pager

# 配置
cat /etc/kubernetes/manifests/kube-apiserver.yaml
```

### 10.10 一键信息收集

```bash
# 信息收集脚本
cat > /tmp/diag.sh <<'EOF'
#!/bin/bash
echo "=== K8s Version ===" > /tmp/diag-output.txt
kubectl version >> /tmp/diag-output.txt 2>&1
echo "=== Nodes ===" >> /tmp/diag-output.txt
kubectl get nodes -o wide >> /tmp/diag-output.txt 2>&1
echo "=== Pods (非 Running) ===" >> /tmp/diag-output.txt
kubectl get pods -A --field-selector=status.phase!=Running >> /tmp/diag-output.txt 2>&1
echo "=== Events (Warning) ===" >> /tmp/diag-output.txt
kubectl get events -A --field-selector type=Warning >> /tmp/diag-output.txt 2>&1
echo "=== kube-system Pods ===" >> /tmp/diag-output.txt
kubectl get pods -n kube-system >> /tmp/diag-output.txt 2>&1
echo "=== etcd 状态 ===" >> /tmp/diag-output.txt
ETCDCTL_API=3 etcdctl endpoint health >> /tmp/diag-output.txt 2>&1
echo "=== 证书 ===" >> /tmp/diag-output.txt
kubeadm certs check-expiration >> /tmp/diag-output.txt 2>&1
echo "完成! 输出到 /tmp/diag-output.txt"
EOF
chmod +x /tmp/diag.sh
bash /tmp/diag.sh
```

---

## 11. 真实案例库

### 案例 1: Calico 节点无法启动 - IP 冲突

**时间**: 2024-03-15  
**影响**: 节点无法加入集群

**现象**:
```
calico-node-xxxx  CrashLoopBackOff
```

**日志**:
```
2024-03-15T10:00:00Z  Failed to start Calico: IP conflict
```

**原因**: 节点 IP 与服务 IP 冲突  
**解决**:

```bash
# 查看冲突 IP
calicoctl ipam show --ip=192.168.10.21

# 重新配置 IP 自动检测
kubectl patch felixconfiguration default --type=merge \
    -p '{"spec":{"ipDetectSource":"first-found"}}'

# 重启 calico-node
kubectl delete pod -n kube-system -l k8s-app=calico-node
```

### 案例 2: 集群证书过期 - 业务中断

**时间**: 2024-06-20  
**影响**: 全部 API 请求失败

**现象**:
```
Unable to connect to the server: x509: certificate has expired or is not yet valid
```

**解决**:

```bash
# 1. SSH 到 Master
ssh k8s-master-01

# 2. 查看证书
kubeadm certs check-expiration

# 3. 续期
sudo kubeadm certs renew all

# 4. 重启组件
sudo systemctl restart kubelet
sudo crictl ps | grep kube-apiserver | awk '{print $1}' | xargs -I{} sudo crictl stop {}
for i in kube-apiserver kube-controller-manager kube-scheduler etcd; do
    sudo systemctl restart $i
done

# 5. 更新 admin.conf
sudo cp /etc/kubernetes/admin.conf ~/.kube/config
```

### 案例 3: Pod 启动慢 - 镜像拉取瓶颈

**时间**: 2024-09-10  
**影响**: 滚动更新卡住 30 分钟

**原因**: 镜像仓库在国外,网络延迟高

**解决**:

```bash
# 配置镜像加速
cat > /etc/containerd/certs.d/registry.k8s.io/hosts.toml <<EOF
server = "https://registry.k8s.io"

[host."https://docker.m.daocloud.io"]
  capabilities = ["pull", "resolve"]
EOF

# 预拉取
crictl pull registry.k8s.io/pause:3.9

# 使用本地 Harbor
# 在 Docker 客户端配置 Harbor
```

### 案例 4: 节点磁盘满 - 业务驱逐

**时间**: 2024-11-05  
**影响**: 节点上所有 Pod 被驱逐

**解决**:

```bash
# 1. 查找大文件
du -sh /var/lib/containerd/* 2>/dev/null | sort -rh | head -20
du -sh /var/log/pods/*/* 2>/dev/null | sort -rh | head -20

# 2. 清理容器镜像
crictl rmi --prune
crictl rmi $(crictl images -q)

# 3. 清理日志
journalctl --vacuum-time=3d
find /var/log/pods -name "*.log" -mtime +7 -delete

# 4. 清理临时文件
rm -rf /tmp/*

# 5. 调整 docker/containerd log driver
cat > /etc/containerd/config.toml <<EOF
[plugins."io.containerd.grpc.v1.cri".containerd]
  disable_snapshot_annotations = true
EOF
```

### 案例 5: etcd 多数节点故障 - 集群不可用

**时间**: 2025-01-12  
**影响**: 集群无法响应任何请求

**现象**:
```
etcdserver: request timed out
```

**原因**: 3 个 etcd 节点中 2 个磁盘故障

**解决**:

```bash
# 1. SSH 到剩余健康节点
ssh k8s-master-02

# 2. 停止所有 etcd
for node in k8s-master-01 k8s-master-02 k8s-master-03; do
    ssh $node "sudo systemctl stop etcd"
done

# 3. 从最近备份恢复
sudo ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd/latest.db \
    --data-dir=/var/lib/etcd-restore \
    --name=master-2 \
    --initial-cluster=master-1=https://192.168.10.11:2380,master-2=https://192.168.10.12:2380,master-3=https://192.168.10.13:2380 \
    --initial-advertise-peer-urls=https://192.168.10.12:2380

# 4. 替换数据目录
sudo mv /var/lib/etcd /var/lib/etcd.old
sudo mv /var/lib/etcd-restore /var/lib/etcd

# 5. 修改 etcd.yaml(指向新数据目录)
sudo -i
sed -i 's|/var/lib/etcd|/var/lib/etcd|g' /etc/kubernetes/manifests/etcd.yaml

# 6. 启动
systemctl start etcd
```

### 案例 6: K8s 升级失败 - 节点 kubelet 版本不一致

**时间**: 2025-04-22  
**影响**: 节点 NotReady

**原因**: 升级时只升级了 kubeadm,忘记升级 kubelet

**解决**:

```bash
# 在所有节点执行
sudo apt-get install -y kubelet=1.31.0-* kubectl=1.31.0-*
sudo apt-mark hold kubelet
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

### 案例 7: 网络抖动 - Calico Felix 重启

**时间**: 2025-07-08  
**影响**: 短暂网络中断 30 秒

**原因**: Calico Felix 检测到链路不稳定

**解决**:

```bash
# 查看 Felix 日志
kubectl logs -n kube-system -l k8s-app=calico-node -c calico-node | grep -i felix

# 调整 Felix 配置
kubectl patch felixconfiguration default --type=merge -p '{
    "spec": {
        "healthTimeoutOverride": 60,
        "reporterInterval": 0
    }
}'
```

### 案例 8: DNS 解析慢 - nodelocaldns 缺失

**时间**: 2025-10-15  
**影响**: 业务请求耗时增加 50ms

**解决**:

```bash
# 部署 nodelocaldns
kubectl apply -f https://raw.githubusercontent.com/kubernetes/kubernetes/master/cluster/addons/dns/nodelocaldns/nodelocaldns.yaml
```

### 案例 9: GPU 节点 Pod 启动失败

**时间**: 2025-12-03  
**影响**: AI 训练任务无法启动

**现象**:
```
Failed to allocate device: not enough GPU
```

**原因**: 节点上残留 GPU 进程

**解决**:

```bash
# 查看 GPU 进程
nvidia-smi

# 清理残留
sudo fuser -k /dev/nvidia*

# 验证
nvidia-smi

# 重启 device plugin
kubectl delete pod -n kube-system -l name=nvidia-device-plugin-ds
```

### 案例 10: 集群 OOM - Kernel panic

**时间**: 2026-02-20  
**影响**: 节点重启,Pod 全部漂移

**原因**: 节点内存分配不合理,kubelet 内存预留不足

**解决**:

```bash
# 修改 kubelet 参数
cat > /etc/default/kubelet <<EOF
KUBELET_EXTRA_ARGS="--kube-reserved=cpu=1,memory=2Gi --system-reserved=cpu=500m,memory=1Gi --eviction-hard=memory.available<5%"
EOF

# 重启
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

---

## 附录: 应急联系清单

| 角色 | 联系电话 | 邮箱 | 升级时间 |
|------|----------|------|----------|
| 值班 SRE | +86-xxx-xxxx-xxx | sre@zs-ai-platform.com | 7×24 |
| 平台 Leader | +86-xxx-xxxx-xxx | platform@zs-ai-platform.com | 工作日 |
| 基础设施 | +86-xxx-xxxx-xxx | infra@zs-ai-platform.com | 工作日 |
| 安全 | +86-xxx-xxxx-xxx | security@zs-ai-platform.com | 7×24 |
| 业务 Owner | +86-xxx-xxxx-xxx | product@zs-ai-platform.com | 工作日 |
| VP 技术 | +86-xxx-xxxx-xxx | vp@zs-ai-platform.com | 紧急 |

---

**文档结束**

如发现遗漏或错误,请联系 SRE 团队 (sre@zs-ai-platform.com)。
