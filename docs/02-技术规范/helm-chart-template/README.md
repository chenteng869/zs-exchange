# ZS-AI-Platform Helm Chart 模板使用说明

## 目录结构

```
helm-chart-template/
├── Chart.yaml              # Chart 元数据
├── values.yaml             # 默认配置
├── templates/
│   ├── _helpers.tpl        # 模板辅助函数
│   ├── deployment.yaml     # Deployment
│   ├── service.yaml        # Service
│   ├── ingress.yaml        # Ingress
│   ├── configmap.yaml      # ConfigMap & Secret
│   ├── hpa.yaml            # HPA / VPA / PDB
│   ├── pvc.yaml            # PVC
│   ├── serviceaccount.yaml # ServiceAccount
│   ├── networkpolicy.yaml  # NetworkPolicy
│   ├── servicemonitor.yaml # ServiceMonitor / PodMonitor
│   ├── prometheusrule.yaml # PrometheusRule (告警规则)
│   └── NOTES.txt           # 安装后提示
```

## 快速开始

### 1. 安装

```bash
# 渲染模板
helm template my-release ./helm-chart-template/

# 干运行
helm install my-release ./helm-chart-template/ --dry-run

# 实际安装
helm install my-release ./helm-chart-template/ \
    --namespace production \
    --create-namespace \
    --values custom-values.yaml
```

### 2. 自定义 values

```bash
# 创建自定义 values
cat > custom-values.yaml <<EOF
replicaCount: 5
image:
  repository: harbor.zs-ai-platform.com/zs-ai-platform/user-service
  tag: "1.0.0"
ingress:
  hosts:
    - host: user.zs-ai-platform.com
      paths:
        - path: /
          pathType: Prefix
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 30
  targetCPUUtilizationPercentage: 60
resources:
  limits:
    cpu: 4000m
    memory: 8Gi
  requests:
    cpu: 1000m
    memory: 2Gi
EOF

# 安装
helm install user-service ./helm-chart-template/ \
    -f custom-values.yaml \
    -n production
```

### 3. 升级

```bash
helm upgrade my-release ./helm-chart-template/ \
    -f custom-values.yaml \
    -n production
```

### 4. 回滚

```bash
# 查看历史
helm history my-release -n production

# 回滚
helm rollback my-release 1 -n production
```

### 5. 卸载

```bash
helm uninstall my-release -n production
```

## 模板渲染示例

```bash
# 渲染后输出到文件
helm template my-release ./helm-chart-template/ > rendered.yaml

# 应用到集群
kubectl apply -f rendered.yaml

# 使用客户端 Diff
helm diff upgrade my-release ./helm-chart-template/ -f custom-values.yaml
```

## values.yaml 核心字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| replicaCount | int | 否 | 副本数(默认 3) |
| image.repository | string | 是 | 镜像仓库地址 |
| image.tag | string | 否 | 镜像 tag(默认 appVersion) |
| image.pullPolicy | string | 否 | 拉取策略 |
| service.type | string | 否 | ClusterIP/NodePort/LoadBalancer |
| ingress.enabled | bool | 否 | 是否启用 Ingress |
| autoscaling.enabled | bool | 否 | 是否启用 HPA |
| persistence.enabled | bool | 否 | 是否启用 PVC |
| resources.limits | object | 是 | 资源限制 |
| resources.requests | object | 是 | 资源请求 |
| serviceMonitor.enabled | bool | 否 | 是否启用 ServiceMonitor |
| prometheusRule.enabled | bool | 否 | 是否启用告警规则 |

## 最佳实践

### 1. 资源设置

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### 2. 健康检查

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /readyz
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 3. 安全上下文

```yaml
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

### 4. 拓扑分布

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
```

### 5. PDB 配置

```yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 2
```

## Linting

```bash
# 渲染测试
helm template my-release ./helm-chart-template/

# YAML 验证
helm template my-release ./helm-chart-template/ | kubectl apply --dry-run=client -f -

# 使用 helm lint
helm lint ./helm-chart-template/

# 严格模式
helm lint ./helm-chart-template/ --strict
```

## CI/CD 集成

```yaml
# GitLab CI 示例
deploy:
  stage: deploy
  script:
    - helm upgrade --install $RELEASE_NAME ./helm-chart-template/
      --namespace $NAMESPACE
      --values values-${ENV}.yaml
      --set image.tag=$CI_COMMIT_SHA
      --wait
      --timeout 10m
```

## 故障排查

```bash
# 查看渲染结果
helm get manifest my-release -n production

# 查看发布信息
helm get all my-release -n production

# 查看历史
helm history my-release -n production

# 调试模板
helm template my-release ./helm-chart-template/ --debug
```
