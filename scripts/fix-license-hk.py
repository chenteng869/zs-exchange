"""Fix LicenseShowcase HK Secondary License section to v6 Royal Premium dark theme"""
import os

path = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\components\differentiation\LicenseShowcase.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Match by the line that contains 'rounded-2xl border border-[#EAECEF] bg-white/50'
# Replace the entire HK section from the comment start to the closing </div>}

# Find the HK section start
hk_start_marker = "      {/* HK Secondary License: Muted card */}"
hk_start = content.find(hk_start_marker)
print(f"Found HK start at: {hk_start}")

if hk_start < 0:
    print("WARN: HK start marker not found")
    exit(1)

# Find the matching closing tag by counting braces - search for the </div>\n      )} that closes this section
# Look for the next 4-space indented closing </div>) pattern after our HK start
# This is the closing of the entire HK card div
end_marker = "      )}\n    </div>\n  );\n}"
end_idx = content.find(end_marker, hk_start)
print(f"Found end at: {end_idx}")

if end_idx < 0:
    print("WARN: end marker not found")
    exit(1)

# Cut out the HK section
new_hk = '''      {/* HK Secondary License: v6 深色版 */}
      {isHK && (
        <div
          className="relative rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(180deg, #131A2E 0%, #0F1830 100%)',
            border: '1px solid #2A3556',
          }}
        >
          {/* Flag & Country */}
          <div className="flex items-start justify-between mb-4">
            <span className="text-4xl leading-none opacity-80">{flagEmoji}</span>
          </div>

          <h3 className="text-xl font-bold text-text-primary mb-1">{license.country}</h3>
          <p
            className="text-base font-semibold mb-1"
            style={{
              background: 'linear-gradient(135deg, #38BDF8 0%, #1677FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            香港HK1683 上市通道
          </p>
          <p className="text-xs text-text-muted mb-4">{license.issuer}</p>

          {/* Divider */}
          <div
            className="h-px w-full mb-4"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.40) 50%, transparent 100%)',
            }}
          />

          {/* Status Badge */}
          <div className="mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.30)',
                color: '#F59E0B',
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              合作中
            </span>
          </div>

          {/* Scope List */}
          <ul className="space-y-2.5 mb-5">
            {scopeItems.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm"
                style={{ color: '#94A3B8' }}
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  style={{ color: '#38BDF8' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          {/* Footer Link */}
          <a
            href={`/licenses#${license.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#94A3B8' }}
          >
            查看详情
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}'''

# Replace the section
# We need to find the closing of the entire LicenseCard function which is end_marker
# The HK section ends right before "    </div>\n  );\n}"  with "      )}" then "\n    </div>"

# Let's find: the comment + content + closing of HK div
# The HK section: hk_start to (end_idx + 3) (including "      )}")
# Then the rest of the file is "    </div>\n  );\n}"

hk_section = content[hk_start:end_idx + len("      )}")]
print(f"Old HK section length: {len(hk_section)}")

new_content = content[:hk_start] + new_hk + content[end_idx + len("      )}"):]
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("OK: LicenseShowcase HK section replaced")
