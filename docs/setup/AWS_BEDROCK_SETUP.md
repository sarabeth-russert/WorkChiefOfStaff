# AWS Bedrock Integration - Setup Guide

## Overview

The Adventureland Chief of Staff system now uses **AWS Bedrock** instead of the Anthropic API directly. This allows you to invoke Claude in **headless mode** using local AWS credentials or IAM roles.

---

## What Changed

### Before (Anthropic API)
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});
```

### After (AWS Bedrock)
```javascript
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
  region: 'us-east-1'
  // Credentials automatically discovered from AWS credential chain
});
```

---

## Architecture

### BedrockClient Wrapper
Location: `/packages/server/src/utils/BedrockClient.js`

This wrapper provides an **Anthropic SDK-compatible interface** using AWS Bedrock Runtime under the hood:

- ✅ Non-streaming messages via `InvokeModelCommand`
- ✅ Streaming messages via `InvokeModelWithResponseStreamCommand`
- ✅ Automatic credential discovery (AWS credential chain)
- ✅ Compatible with existing agent code (drop-in replacement)

### Updated Components
1. **BaseAgent** - Now uses `bedrockClient` instead of Anthropic SDK
2. **VectorSearch** - Semantic search powered by Bedrock
3. **Configuration** - AWS credentials instead of API key

---

## AWS Credentials Setup

### Option 1: AWS Profile (Recommended for Local Development)

1. **Configure AWS credentials file** (`~/.aws/credentials`):
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

2. **Set environment variables** in `packages/server/.env`:
```bash
AWS_PROFILE=default
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

3. **Restart the server**:
```bash
npx pm2 restart adventureland-server
```

### Option 2: Environment Variables

Set AWS credentials directly as environment variables:

```bash
# In packages/server/.env or export in shell
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

⚠️ **Not recommended** for production - use IAM roles or profiles instead.

### Option 3: IAM Role (Production/EC2/ECS)

When running on AWS infrastructure (EC2, ECS, Lambda), credentials are **automatically** obtained from the IAM role attached to the instance.

No configuration needed - the AWS SDK will automatically use the instance's IAM role.

### Option 4: Local Bedrock (Headless Mode)

For local Bedrock testing or offline development:

1. **Install AWS CLI** and configure local endpoint:
```bash
aws configure set endpoint_url http://localhost:4566  # For LocalStack
```

2. **Configure Bedrock endpoint** (if using local mock):
```javascript
// In BedrockClient.js, add endpoint configuration
this.client = new BedrockRuntimeClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566'  // Local Bedrock endpoint
});
```

---

## Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AWS_PROFILE` | AWS profile name from `~/.aws/credentials` | `default` | No* |
| `AWS_REGION` | AWS region for Bedrock | `us-east-1` | No |
| `AWS_ACCESS_KEY_ID` | AWS access key (alternative to profile) | - | No* |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (alternative to profile) | - | No* |
| `AWS_BEDROCK_MODEL_ID` | Bedrock model identifier | `anthropic.claude-3-5-sonnet-20241022-v2:0` | No |

*At least one credential method must be available (profile, env vars, or IAM role)

### Available Bedrock Models

| Model ID | Description |
|----------|-------------|
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | Claude 3.5 Sonnet (Default) |
| `anthropic.claude-3-sonnet-20240229-v1:0` | Claude 3 Sonnet |
| `anthropic.claude-3-opus-20240229-v1:0` | Claude 3 Opus |
| `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku |

To change the model, update `AWS_BEDROCK_MODEL_ID` in `.env`.

---

## Credential Discovery Order

The AWS SDK automatically discovers credentials in this order:

1. **Environment variables** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. **AWS credentials file** (`~/.aws/credentials`) with `AWS_PROFILE`
3. **ECS container credentials** (if running on ECS)
4. **EC2 instance metadata** (if running on EC2)
5. **Local Bedrock configuration**

---

## Verification

### 1. Check Logs
After starting the server, you should see:

```
AWS Bedrock Configuration:
  - Region: us-east-1
  - Model: anthropic.claude-3-5-sonnet-20241022-v2:0
  - Credentials: AWS Profile (default)

BedrockClient initialized
```

View logs:
```bash
npx pm2 logs adventureland-server
```

### 2. Test Agent Interaction

1. Open http://localhost:5555
2. Navigate to **Expedition**
3. Select any agent (e.g., Explorer)
4. Submit a task: "Review this code: `const x = 1;`"
5. You should see a streaming response from Claude via Bedrock

### 3. Test API Endpoint

```bash
curl -X POST http://localhost:5554/api/agents/task \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "explorer",
    "taskType": "code_review",
    "task": "Explain what this does: const add = (a, b) => a + b;"
  }'
```

---

## Headless Mode Usage

### Via REST API

```javascript
// POST request to invoke agent headlessly
const response = await fetch('http://localhost:5554/api/agents/task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'explorer',
    taskType: 'code_review',
    task: 'Your task here'
  })
});

const result = await response.json();
console.log(result.response);
```

### Via Socket.IO (Streaming)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5554');

socket.on('connect', () => {
  // Submit task
  socket.emit('agent:task', {
    agentType: 'explorer',
    taskType: 'code_review',
    task: 'Your task here'
  });
});

// Receive streaming chunks
socket.on('agent:task:chunk', (data) => {
  process.stdout.write(data.chunk);
});

// Final response
socket.on('agent:task:response', (data) => {
  console.log('\n\nFull response:', data.response);
});
```

### Via CLI Script

Create `scripts/invoke-agent.js`:

```javascript
#!/usr/bin/env node
import { io } from 'socket.io-client';

const socket = io('http://localhost:5554');
const task = process.argv[2] || 'Hello';

socket.on('connect', () => {
  socket.emit('agent:task', {
    agentType: 'explorer',
    task: task
  });
});

socket.on('agent:task:chunk', (data) => {
  process.stdout.write(data.chunk);
});

socket.on('agent:task:completed', () => {
  console.log('\n');
  process.exit(0);
});

socket.on('agent:task:error', (data) => {
  console.error('Error:', data.error);
  process.exit(1);
});
```

Usage:
```bash
node scripts/invoke-agent.js "Review this code: const x = 1;"
```

---

## Troubleshooting

### Error: "Missing credentials in config"

**Cause**: AWS credentials not configured.

**Solution**:
1. Run `aws configure` to set up credentials
2. Or set `AWS_PROFILE=default` in `.env`
3. Or provide `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Error: "Access Denied" or "403 Forbidden"

**Cause**: IAM permissions insufficient.

**Solution**: Ensure your AWS IAM user/role has Bedrock permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    }
  ]
}
```

### Error: "Cannot find module '@aws-sdk/client-bedrock-runtime'"

**Cause**: Dependencies not installed correctly.

**Solution**:
```bash
cd packages/server
rm -rf node_modules package-lock.json
npm install
npx pm2 restart adventureland-server
```

### Error: "Model not found" or "404 Not Found"

**Cause**: Bedrock not enabled in your AWS region or model ID incorrect.

**Solution**:
1. Check AWS Console → Bedrock → Model access
2. Request access to Claude models
3. Verify `AWS_BEDROCK_MODEL_ID` matches available models
4. Try a different region where Bedrock is available

---

## Benefits of AWS Bedrock

### vs. Direct Anthropic API

| Feature | Anthropic API | AWS Bedrock |
|---------|---------------|-------------|
| **Authentication** | API Key | AWS IAM (more secure) |
| **Deployment** | Internet required | Can use VPC endpoints |
| **Credentials** | Manual key management | Automatic credential chain |
| **Billing** | Anthropic billing | Consolidated AWS billing |
| **Compliance** | Anthropic terms | AWS compliance certifications |
| **Scaling** | Anthropic infrastructure | AWS infrastructure |
| **Cost** | Per API call | Per API call (potentially lower) |

### Production Advantages

✅ **IAM Role-Based**: No API keys to manage or rotate
✅ **VPC Endpoints**: Private connectivity without internet
✅ **CloudWatch Integration**: Automatic logging and monitoring
✅ **AWS Ecosystem**: Integrates with Lambda, ECS, EC2, etc.
✅ **Centralized Billing**: Single AWS bill
✅ **Compliance**: HIPAA, SOC2, etc. via AWS

---

## Next Steps

1. ✅ **Configure AWS credentials** (profile, env vars, or IAM role)
2. ✅ **Verify Bedrock access** in AWS Console
3. ✅ **Restart the server** and check logs
4. ✅ **Test agent interaction** via UI or API
5. ✅ **Deploy to production** with IAM roles

---

## References

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Claude on Bedrock](https://docs.anthropic.com/claude/docs/claude-on-amazon-bedrock)
- [AWS Credential Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)

---

**Enjoy using Claude via AWS Bedrock in headless mode!** 🚀🌴
