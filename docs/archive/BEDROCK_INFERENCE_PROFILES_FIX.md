# AWS Bedrock Inference Profiles - Fix Documentation

## Problem

Provider validation was failing with the error:

```
ValidationException: Invocation of model ID anthropic.claude-3-5-sonnet-20241022-v2:0
with on-demand throughput isn't supported. Retry your request with the ID or ARN of
an inference profile that contains this model.
```

## Root Cause

AWS Bedrock changed their model access requirements. As of late 2024, **direct model IDs can no longer be used with on-demand throughput**. Instead, you must use:

1. **Cross-region inference profiles** (recommended)
2. **Model ARNs** (for provisioned throughput)

## Solution Applied

Updated all default model IDs from direct model IDs to cross-region inference profiles:

### Before (❌ Broken)
```
anthropic.claude-3-5-sonnet-20241022-v2:0
```

### After (✅ Working)
```
us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

## What Changed

### Files Updated:

1. **`/packages/server/src/providers/BedrockProvider.js`**
   - Updated default model ID
   - Updated available models list to use inference profiles
   - All models now use `us.` prefix (US cross-region)

2. **`/packages/server/src/config/ConfigStore.js`**
   - Updated default Bedrock configuration
   - Updated fallback model ID

3. **`/packages/server/src/config/env.js`**
   - Updated environment variable default

### New Default Model IDs:

| Model | New Inference Profile ID |
|-------|-------------------------|
| Claude 3.5 Sonnet v2 | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` |
| Claude 3.5 Sonnet v1 | `us.anthropic.claude-3-5-sonnet-20240620-v1:0` |
| Claude 3 Opus | `us.anthropic.claude-3-opus-20240229-v1:0` |
| Claude 3 Sonnet | `us.anthropic.claude-3-sonnet-20240229-v1:0` |
| Claude 3 Haiku | `us.anthropic.claude-3-haiku-20240307-v1:0` |

## About Cross-Region Inference Profiles

**Benefits:**
- ✅ Better availability across multiple AWS regions
- ✅ Automatic failover if a region has issues
- ✅ No additional setup required beyond Bedrock access
- ✅ Same pricing as direct model access

**Available Regions:**
- `us.` - United States (multi-region)
- `eu.` - Europe (multi-region)

**How They Work:**
- AWS automatically routes your request to the best available region
- Provides higher uptime and reliability
- Transparent to your application

## Verification

After applying the fix, validation now succeeds:

```bash
curl -X POST http://localhost:5554/api/config/providers/bedrock/validate \
  -H "Content-Type: application/json" \
  -d '{"region":"us-east-1","modelId":"us.anthropic.claude-3-5-sonnet-20241022-v2:0"}'

# Response:
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

## Using Different Regions

If you need to use EU-based inference profiles instead:

1. Go to Settings → Models
2. Change model ID from `us.` to `eu.` prefix
3. Example: `eu.anthropic.claude-3-5-sonnet-20241022-v2:0`

## Environment Variable Override

You can also set the model via environment variable:

```bash
# In packages/server/.env
AWS_BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

## AWS Bedrock Access Requirements

To use Bedrock, ensure you have:

1. ✅ **AWS Credentials configured**:
   - Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
   - AWS credentials file (`~/.aws/credentials`)
   - IAM role (if running on AWS)

2. ✅ **Bedrock Model Access**:
   - Go to AWS Console → Bedrock → Model Access
   - Request access to Anthropic Claude models
   - Wait for approval (usually instant for most accounts)

3. ✅ **Correct Region**:
   - Default: `us-east-1`
   - Can be changed in Settings → Providers

## Testing Your Configuration

1. **Via Settings UI**:
   - Navigate to http://localhost:5555/settings
   - Go to Providers tab
   - Click "Test Connection"
   - Should see: ✓ Provider credentials are valid

2. **Via API**:
   ```bash
   curl http://localhost:5554/api/config/providers/bedrock/validate \
     -H "Content-Type: application/json" \
     -d '{"region":"us-east-1"}'
   ```

3. **Test an Agent**:
   - Go to Expedition page
   - Select any agent (e.g., Explorer)
   - Submit a test task: "Say hello"
   - Should receive a response from Claude

## Additional Resources

- [AWS Bedrock Inference Profiles Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [AWS Bedrock Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
- [Anthropic Models on Bedrock](https://docs.anthropic.com/en/api/claude-on-amazon-bedrock)

## Status

✅ **FIXED** - Bedrock provider validation now works with inference profiles

✅ **Configuration updated** - All defaults use cross-region inference profiles

✅ **Models available** - UI shows correct inference profile IDs

✅ **Agents working** - All agents can now use Bedrock successfully
