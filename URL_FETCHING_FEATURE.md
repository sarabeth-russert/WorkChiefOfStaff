# URL Fetching Feature ✅

## Overview

Your AI agents can now **automatically fetch and analyze web URLs**! Just paste a URL in your task, and the agent will retrieve the content and analyze it for you.

---

## How It Works

### 🌐 Automatic Detection

When you submit a task containing a URL, the agent:
1. **Detects** the URL in your message
2. **Fetches** the web page content
3. **Converts** HTML to readable markdown
4. **Analyzes** the content in context of your question

All automatically—no extra steps needed!

---

## Usage Examples

### Example 1: Analyze a Repository

```
Select: Archaeologist
Task: "Analyze this repository: https://github.com/atomantic/PortOS"

Archaeologist will:
1. Fetch the GitHub page
2. Extract README and repo info
3. Provide detailed analysis
```

### Example 2: Learn from Documentation

```
Select: Guide
Task: "Explain the key concepts from https://react.dev/learn/thinking-in-react"

Guide will:
1. Fetch the React docs page
2. Extract the tutorial content
3. Explain key concepts in their own words
```

### Example 3: Code Review from URL

```
Select: Explorer
Task: "Review the code quality at https://github.com/user/repo/blob/main/src/app.js"

Explorer will:
1. Fetch the file from GitHub
2. Analyze code patterns
3. Provide recommendations
```

### Example 4: Compare Multiple Sources

```
Select: Archaeologist
Task: "Compare the approaches in these two articles:
https://example.com/article1
https://example.com/article2"

Archaeologist will:
1. Fetch both URLs
2. Extract content from each
3. Compare and contrast the approaches
```

### Example 5: Debug from Stack Overflow

```
Select: Scout
Task: "Help me understand this solution: https://stackoverflow.com/questions/12345"

Scout will:
1. Fetch the Stack Overflow page
2. Extract question and answers
3. Explain the solution
```

---

## Supported URLs

### ✅ Works Great With

- **GitHub**: Repositories, files, README, issues
- **Documentation sites**: React, Vue, Express, etc.
- **Blog posts**: Technical articles, tutorials
- **Stack Overflow**: Questions and answers
- **Technical forums**: Dev.to, Medium, etc.
- **API docs**: OpenAPI, Swagger, etc.

### ⚠️ May Have Issues With

- **Authentication-required sites**: Private repos, paywalled content
- **JavaScript-heavy SPAs**: May miss dynamically loaded content
- **PDFs**: Better to download and paste text
- **Very large pages**: Content truncated at 50,000 characters
- **Rate-limited sites**: May fail if site blocks automated requests

---

## Features

### Smart Content Extraction

The fetcher intelligently extracts main content by:
- Looking for `<main>`, `<article>`, or similar semantic tags
- Removing navigation, footers, ads, scripts
- Converting HTML to clean markdown
- Preserving code blocks and formatting

### Multiple URLs

You can include multiple URLs in one task:

```
"Compare these three implementations:
https://example.com/impl1
https://example.com/impl2
https://example.com/impl3"
```

Each URL will be fetched and included in the analysis.

### Conversation Context

URL fetching works with conversation history:

```
You: "Fetch https://github.com/atomantic/PortOS"
Agent: [analyzes PortOS]

You: "How does our implementation compare?"
Agent: [remembers PortOS content from earlier and compares]
```

---

## Best Practices

### ✅ Do

1. **Be specific about what you want**:
   - ❌ "Look at this URL: https://..."
   - ✅ "Summarize the key features from: https://..."

2. **Use with the right agent**:
   - **Archaeologist**: Research, documentation, analysis
   - **Guide**: Learning from tutorials
   - **Explorer**: Code analysis from repos
   - **Scout**: Debugging solutions
   - **Navigator**: CI/CD workflows, deployment docs
   - **Trader**: Package comparison, dependency research

3. **Combine with follow-ups**:
   ```
   "Analyze this repo: https://..."
   [Agent responds]
   "Now compare it to our implementation"
   ```

4. **Use for real-time info**:
   - Current package versions
   - Latest API documentation
   - Recent Stack Overflow solutions

### ❌ Don't

1. **Don't rely on JavaScript-rendered content**: Static HTML only
2. **Don't fetch private URLs**: Authentication not supported
3. **Don't expect perfect extraction**: Some sites format poorly
4. **Don't abuse**: Respect rate limits, be reasonable with requests

---

## Technical Details

### What Gets Fetched

- **Page title**: Extracted from `<title>` tag
- **Main content**: From `<main>`, `<article>`, or `<body>`
- **Formatted as markdown**: For better readability

### What Gets Removed

- Scripts, styles, navigation
- Footers, ads, sidebars
- Iframes, noscript tags
- Other non-content elements

### Size Limits

- **Maximum content**: 50,000 characters
- **Timeout**: 10 seconds per URL
- **Reason**: Prevent API token overload

### User Agent

Requests are made with:
```
User-Agent: Mozilla/5.0 (compatible; AdventurelandBot/1.0)
```

Some sites may block or rate-limit automated requests.

---

## Troubleshooting

### "Failed to fetch URL"

**Possible causes:**
1. URL is invalid or unreachable
2. Site blocks automated requests
3. Network timeout (10 second limit)
4. Site requires authentication

**Solutions:**
- Try the URL in your browser first
- Copy-paste content manually if fetch fails
- Check for typos in the URL

### "Content seems incomplete"

**Possible causes:**
1. Content loads via JavaScript (not supported)
2. Content behind authentication
3. Content truncated due to size limit

**Solutions:**
- View page source in browser to see static HTML
- Download and paste content manually
- Break into smaller requests

### "Getting generic/weird content"

**Possible causes:**
1. Site has complex layout
2. Content extraction picked wrong element
3. Site uses unusual HTML structure

**Solutions:**
- Try a different URL (e.g., raw GitHub instead of rendered page)
- Paste specific content manually
- Use documentation or simpler page layouts

---

## Examples by Agent

### 🏺 Archaeologist - Research

**Best for:** Documentation, API research, learning about technologies

```
"Research the authentication methods described at:
https://docs.example.com/auth"
```

### 📖 Guide - Tutorials

**Best for:** Learning, step-by-step guides, tutorials

```
"Walk me through the tutorial at:
https://tutorial.example.com/getting-started"
```

### 🗺️ Explorer - Code Analysis

**Best for:** Analyzing code repositories, architecture reviews

```
"Analyze the architecture of:
https://github.com/user/repo"
```

### 🔭 Scout - Debugging

**Best for:** Finding solutions, debugging help

```
"Explain this solution:
https://stackoverflow.com/questions/12345"
```

### 🧭 Navigator - Deployment Guides

**Best for:** CI/CD, deployment workflows

```
"Summarize the deployment process from:
https://docs.example.com/deploy"
```

### 💰 Trader - Package Research

**Best for:** Comparing packages, dependency research

```
"Compare these two libraries:
https://npmjs.com/package/library-a
https://npmjs.com/package/library-b"
```

---

## Privacy & Security

### What's Sent

When you provide a URL:
1. The agent fetches the public content
2. Content is sent to Claude API for analysis
3. URL and content are logged locally

### What's NOT Sent

- Your credentials or cookies
- Private/authenticated content
- Any data beyond the public URL

### Local Logs

Fetched URLs are logged to:
```
/packages/server/logs/combined.log
```

This includes:
- URL requested
- Success/failure status
- Content length
- Timestamp

---

## API Cost Considerations

### Token Usage

Fetched content counts toward your API token usage:
- Average web page: 5,000-15,000 tokens
- Large documentation page: 20,000-50,000 tokens
- This is **in addition** to your question and response

### Cost Management

1. **Be selective**: Only fetch URLs when needed
2. **Use specific pages**: Don't fetch entire documentation sites
3. **Consider alternatives**: Sometimes copying specific sections is cheaper
4. **Monitor usage**: Check your API provider's dashboard

---

## Comparison with Manual Copy-Paste

### URL Fetching Advantages

- ✅ Faster (no manual copying)
- ✅ Gets fresh content (not outdated)
- ✅ Works with multiple URLs easily
- ✅ Conversation can reference URLs later

### Manual Copy-Paste Advantages

- ✅ You control exactly what's included
- ✅ Works with authenticated/private content
- ✅ Works with PDFs and other formats
- ✅ May use fewer tokens (you select key parts)

**Recommendation**: Use URL fetching for public content, copy-paste for everything else.

---

## Future Enhancements

Potential improvements:
- 📄 PDF support
- 🔐 Authentication support (OAuth, API keys)
- 🖼️ Screenshot capability
- 📊 Better extraction for complex sites
- 💾 Cache fetched content
- 🔍 Search within fetched content

---

## Summary

Your agents can now autonomously fetch and analyze web content! Just include a URL in your task, and they'll handle the rest.

**Try it now:**
1. Go to Expedition
2. Select Archaeologist
3. Try: "Analyze https://github.com/atomantic/PortOS"

**Your agents are now web-enabled!** 🌐✨
