import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5554,
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: process.env.DATA_DIR || './data',
  logLevel: process.env.LOG_LEVEL || 'info',
  aws: {
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    profile: process.env.AWS_PROFILE || undefined,
    modelId: process.env.AWS_BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
  }
};

// Validate required environment variables
export function validateEnv() {
  // AWS credentials are validated by AWS SDK automatically
  // It will use credentials from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. AWS credentials file (~/.aws/credentials with AWS_PROFILE)
  // 3. IAM role (when running on EC2/ECS/Lambda)
  // 4. Local Bedrock configuration

  // No hard requirements - AWS SDK handles credential chain
  // Just log the configuration being used
  const credentialSource = process.env.AWS_ACCESS_KEY_ID ? 'Environment Variables' :
                           process.env.AWS_PROFILE ? `AWS Profile (${process.env.AWS_PROFILE})` :
                           'Default Credential Chain (IAM Role or ~/.aws/credentials)';

  console.log(`AWS Bedrock Configuration:
  - Region: ${config.aws.region}
  - Model: ${config.aws.modelId}
  - Credentials: ${credentialSource}
  `);
}

export default config;
