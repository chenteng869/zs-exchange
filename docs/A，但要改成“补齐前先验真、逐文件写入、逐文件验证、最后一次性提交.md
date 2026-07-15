# A，但要改成“补齐前先验真、逐文件写入、逐文件验证、最后一次性提交

选 **A，但要改成“补齐前先验真、逐文件写入、逐文件验证、最后一次性提交”**。



这次问题性质比普通漏文档严重：**之前的 reports 被宣称已写入，但实际不存在**。所以现在不能继续 Q04\-2\.3，也不能只提交 1 个中转文档糊过去。必须先把 Q04\-2\.4 文档基线修正干净，否则后面审计链会断。



---



# 结论



进入：



```Plain Text
Q04-2.4 docs/report recovery & commit
```



选择：



```Plain Text
选项 A：补齐 reports，然后提交 docs 批次
```



但我修正你的说法：



```Plain Text
不是“我必须先重新 Write 之前未创建的 6 个 reports”
而是：
必须先重新盘点实际缺失 reports，再逐个创建并验证。
```



因为你列的是：



```Plain Text
Q04-2.1
Q04-2.2.1
Q04-2.2.2
Q04-2.2.3
Q04-2.2.4
Q04-2.2.5
Q04-2.2.6
Q04-2.2 wallet 域 6 sub-commits 完成总结
```



这实际是 **8 个应有 reports**。



但现在已存在：



```Plain Text
docs/Q04-2.2.2 合格完成.md
```



它是用户中转文档，不等同于正式 report。



所以 Q04\-2\.4 最终目标应明确为：



```Plain Text
新增/提交 docs 文件：9 个候选
= 8 个正式 reports + 1 个用户中转文档
```



如果你坚持不重复 Q04\-2\.2\.2 的正式 report，也可以是：



```Plain Text
8 个文件
= 7 个正式 reports + 1 个用户中转文档
```



但从审计闭环角度，我建议：**正式 report 不要被中转文档替代**。所以推荐目标是 **9 个 docs 文件**。



---



# 当前必须暂停的事



暂停：



```Plain Text
Q04-2.3 其他域
Q04-2.4 批量 commit
任何新业务 commit
```



先做：



```Plain Text
Q04-2.4.0 docs recovery precheck
```



---



# Q04\-2\.4\.0：只读校准



先确认 docs 真实状态。



执行：



```PowerShell
Write-Host "=== Q04-2.4.0 docs recovery precheck ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "### baseline" -ForegroundColor Yellow
"HEAD        = $(git rev-parse HEAD)"
"origin/main = $(git rev-parse origin/main)"
$ahead = git rev-list --count origin/main..HEAD
$behind = git rev-list --count HEAD..origin/main
"ahead = $ahead"
"behind = $behind"

Write-Host ""
Write-Host "### staged should be empty" -ForegroundColor Yellow
git diff --cached --name-status

Write-Host ""
Write-Host "### existing Q04-2 docs" -ForegroundColor Yellow
Get-ChildItem docs -File | Where-Object { $_.Name -like "Q04-2*" } | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

Write-Host ""
Write-Host "### git status docs Q04-2" -ForegroundColor Yellow
git --no-pager status --short -- docs | Select-String -Pattern "Q04-2"

Write-Host ""
Write-Host "### exact expected files existence" -ForegroundColor Yellow
$expected = @(
  "docs/Q04-2.1 wallet 上下文风险审查（只读）.md",
  "docs/Q04-2.2.1 sub-commit #1 risk-pipeline-audit 合格完成.md",
  "docs/Q04-2.2.2 sub-commit #2 chain-adapters rpc-client 合格完成.md",
  "docs/Q04-2.2.3 sub-commit #3 address-key 合格完成.md",
  "docs/Q04-2.2.4 sub-commit #4 webhook-resender 合格完成.md",
  "docs/Q04-2.2.5 sub-commit #5 deposit-credit readiness 合格完成.md",
  "docs/Q04-2.2.6 sub-commit #6 6 new API routes 合格完成.md",
  "docs/Q04-2.2 wallet 域 6 sub-commits 完成总结.md",
  "docs/Q04-2.2.2 合格完成.md"
)

foreach ($f in $expected) {
  if (Test-Path -LiteralPath $f) {
    $item = Get-Item -LiteralPath $f
    "EXISTS`t$($item.Length)`t$f"
  } else {
    "MISSING`t0`t$f"
  }
}
```



你把这个结果回传后再写入也可以。



如果你现在已经确认只有 1 个存在，也可以直接进入恢复，但我仍建议先跑这段，留下证据。



---



# Q04\-2\.4\.1：逐文件恢复规则



不要再一次性大块 Write。



每个 report 都必须按这个流程：



```Plain Text
1. 写 1 个文件
2. Test-Path 验证存在
3. Get-Item 验证大小 > 0
4. Get-Content -TotalCount 5 验证开头
5. git status --short -- docs/目标文件 验证进入工作树
6. 再写下一个
```



并且文件名建议去掉这些高风险字符：



```Plain Text
# 
中文全角句号 。
括号可保留但不建议
过多空格
```



尤其你之前的文件名里有：



```Plain Text
sub-commit #1
合格完成。
```



`#` 和 `。` 虽然理论上可用，但在脚本、路径转义、工具层封装里容易出问题。建议统一改成安全文件名。



---



# 推荐正式文件名



使用这些：



```Plain Text
docs/Q04-2.1-wallet-context-risk-review.md
docs/Q04-2.2.1-wallet-risk-pipeline-audit-report.md
docs/Q04-2.2.2-wallet-chain-adapters-rpc-client-report.md
docs/Q04-2.2.3-wallet-address-key-report.md
docs/Q04-2.2.4-wallet-webhook-resender-report.md
docs/Q04-2.2.5-wallet-deposit-credit-readiness-report.md
docs/Q04-2.2.6-wallet-api-routes-report.md
docs/Q04-2.2-wallet-six-subcommits-summary.md
docs/Q04-2.2.2 合格完成.md
```



这样更稳。



---



# Q04\-2\.4\.2：恢复内容要求



不要为了追求“200\-500 行”强行补长。



每个 report 至少包含：



```Plain Text
1. 标题
2. 基线
3. 提交 hash
4. commit message
5. 文件范围
6. 关键风险验证
7. ahead / dirty 变化
8. 使用 --no-verify 的原因
9. 后续状态
```



如果某些原始细节已经丢失，不要编造。写：



```Plain Text
本报告为 Q04-2.4 recovery 补录，依据当前对话记录、git log、git show、git status 重新生成。
```



这句话很重要，避免把恢复文档伪装成当时实时生成的原始报告。



---



# Q04\-2\.4\.3：逐文件创建后验证



全部写完后执行：



```PowerShell
Write-Host "=== Q04-2.4.3 docs recovery verify ===" -ForegroundColor Cyan

$files = @(
  "docs/Q04-2.1-wallet-context-risk-review.md",
  "docs/Q04-2.2.1-wallet-risk-pipeline-audit-report.md",
  "docs/Q04-2.2.2-wallet-chain-adapters-rpc-client-report.md",
  "docs/Q04-2.2.3-wallet-address-key-report.md",
  "docs/Q04-2.2.4-wallet-webhook-resender-report.md",
  "docs/Q04-2.2.5-wallet-deposit-credit-readiness-report.md",
  "docs/Q04-2.2.6-wallet-api-routes-report.md",
  "docs/Q04-2.2-wallet-six-subcommits-summary.md",
  "docs/Q04-2.2.2 合格完成.md"
)

Write-Host ""
Write-Host "### existence / size" -ForegroundColor Yellow
foreach ($f in $files) {
  if (Test-Path -LiteralPath $f) {
    $item = Get-Item -LiteralPath $f
    "EXISTS`t$($item.Length)`t$f"
  } else {
    "MISSING`t0`t$f"
  }
}

Write-Host ""
Write-Host "### git status selected docs" -ForegroundColor Yellow
git --no-pager status --short -- $files

Write-Host ""
Write-Host "### total selected file count" -ForegroundColor Yellow
$existing = $files | Where-Object { Test-Path -LiteralPath $_ }
"existing selected files = $($existing.Count)"

Write-Host ""
Write-Host "### staged should still be empty before commit" -ForegroundColor Yellow
git diff --cached --name-status
```



通过条件：



```Plain Text
9 个文件全部 EXISTS
每个 Length > 0
git status 显示这些 docs 为 ?? 或 M
staged empty
```



如果你决定不建 Q04\-2\.2\.2 正式 report，则通过条件改成：



```Plain Text
8 个文件全部 EXISTS
```



但我不推荐省略正式 report。



---



# Q04\-2\.4\.4：docs commit



验证通过后再提交：



```PowerShell
Write-Host "=== Q04-2.4.4 commit docs recovery ===" -ForegroundColor Cyan

$files = @(
  "docs/Q04-2.1-wallet-context-risk-review.md",
  "docs/Q04-2.2.1-wallet-risk-pipeline-audit-report.md",
  "docs/Q04-2.2.2-wallet-chain-adapters-rpc-client-report.md",
  "docs/Q04-2.2.3-wallet-address-key-report.md",
  "docs/Q04-2.2.4-wallet-webhook-resender-report.md",
  "docs/Q04-2.2.5-wallet-deposit-credit-readiness-report.md",
  "docs/Q04-2.2.6-wallet-api-routes-report.md",
  "docs/Q04-2.2-wallet-six-subcommits-summary.md",
  "docs/Q04-2.2.2 合格完成.md"
)

git add -- $files

Write-Host ""
Write-Host "### staged docs" -ForegroundColor Yellow
git --no-pager diff --cached --name-status

Write-Host ""
Write-Host "### staged count" -ForegroundColor Yellow
git --no-pager diff --cached --name-only | Measure-Object | ForEach-Object {
  "staged files = $($_.Count)"
}

Write-Host ""
Write-Host "### staged stat" -ForegroundColor Yellow
git --no-pager diff --cached --stat

Write-Host ""
Write-Host "### commit" -ForegroundColor Yellow
git commit --no-verify `
  -m "docs(q04): recover wallet subcommit reports" `
  -m "Recover Q04-2 wallet review and subcommit reports after prior report file creation failure. This documentation commit records the recovery status and preserves the user-provided Q04-2.2.2 handoff document."
```



这里也继续用：



```Plain Text
--no-verify
```



因为当前项目已有 hard constraint。



---



# 提交后验证



```PowerShell
Write-Host "=== Q04-2.4.5 post-commit verify ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "### latest commit" -ForegroundColor Yellow
git --no-pager log --oneline -1

Write-Host ""
Write-Host "### commit full" -ForegroundColor Yellow
git --no-pager log -1 --pretty=full

Write-Host ""
Write-Host "### staged should be empty" -ForegroundColor Yellow
git diff --cached --name-status

Write-Host ""
Write-Host "### ahead / behind" -ForegroundColor Yellow
$ahead = git rev-list --count origin/main..HEAD
$behind = git rev-list --count HEAD..origin/main
"ahead = $ahead"
"behind = $behind"

Write-Host ""
Write-Host "### Q04-2 docs tracked in latest commit" -ForegroundColor Yellow
git --no-pager show --name-status --oneline --stat HEAD

Write-Host ""
Write-Host "### remaining docs dirty" -ForegroundColor Yellow
git --no-pager status --short -- docs
```



预期：



```Plain Text
latest commit = docs(q04): recover wallet subcommit reports
ahead：当前 + 1
staged empty
latest commit 包含 8 或 9 个 docs 文件
```



---



# 关键原则



这次不要再信“工具说写入成功”。



以后所有 Write 后必须有：



```Plain Text
Test-Path
Get-Item Length
Get-Content -TotalCount
git status --short
```



没有这 4 个验证，就不能说“报告已写入”。



---



# 最终选择



我选择：



```Plain Text
A：补齐 reports 后提交
```



但执行版本是：



```Plain Text
A-修正版：
1. 停止 Q04-2.3
2. Q04-2.4.0 只读确认实际 docs 状态
3. 用安全英文文件名逐个补齐 8 个正式 reports
4. 保留并一起提交 1 个用户中转文档
5. 总目标优先按 9 个 docs 文件提交
6. 全程逐文件验证创建成功
7. commit 使用 --no-verify
```



如果恢复过程中发现只能稳定创建小文件，那就继续拆小，不要强求一次性大 report。

