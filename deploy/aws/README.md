# AWS Deployment

Deploy the Finance App on Amazon Web Services.

> **Status**: 🚧 Coming Soon - Deployment guide in progress

## Overview

This guide will cover multiple AWS deployment strategies:

1. **EC2 + RDS** - Traditional server deployment
2. **ECS/Fargate** - Containerized deployment
3. **EKS** - Kubernetes deployment
4. **Elastic Beanstalk** - Platform-as-a-Service
5. **Lambda + API Gateway** - Serverless deployment (with adaptations)

## Architecture Options

### Option 1: EC2 + RDS (Simple)

```
┌─────────────────┐
│  Application    │
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │   EC2   │ ◄── Auto Scaling Group
    │ Instances│
    └────┬────┘
         │
    ┌────┴────┐
    │   RDS   │
    │PostgreSQL│
    └─────────┘
```

**Pros:**
- Simple to understand
- Full control over servers
- Predictable costs

**Cons:**
- Manual scaling
- Server maintenance required

### Option 2: ECS + Fargate (Recommended)

```
┌─────────────────┐
│  Application    │
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │   ECS   │ ◄── Fargate (serverless containers)
    │  Tasks  │
    └────┬────┘
         │
    ┌────┴────┐
    │   RDS   │
    │PostgreSQL│
    └─────────┘
```

**Pros:**
- No server management
- Auto-scaling
- Pay per use
- Native Docker support

**Cons:**
- Slightly more complex setup
- Cold starts (minimal for web apps)

### Option 3: EKS (Enterprise)

Full Kubernetes deployment for complex applications with microservices.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Docker (for container deployments)
- Terraform or CloudFormation (optional, for IaC)

## Quick Start (Coming Soon)

### 1. Set Up Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier finance-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20

# Get connection endpoint
aws rds describe-db-instances \
  --db-instance-identifier finance-app-db \
  --query 'DBInstances[0].Endpoint.Address'
```

### 2. Deploy Application

```bash
# EC2 deployment commands here
# Or ECS deployment commands
# Or EKS deployment commands
```

### 3. Configure Environment Variables

```bash
# Using AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name /finance-app/DATABASE_URL \
  --value "postgresql://..." \
  --type SecureString

aws ssm put-parameter \
  --name /finance-app/SESSION_SECRET \
  --value "..." \
  --type SecureString
```

## Services Used

### Compute
- **EC2** - Virtual servers
- **ECS** - Container orchestration
- **EKS** - Managed Kubernetes
- **Fargate** - Serverless containers
- **Elastic Beanstalk** - PaaS

### Database
- **RDS PostgreSQL** - Managed PostgreSQL
- **Aurora PostgreSQL** - High-performance PostgreSQL

### Networking
- **VPC** - Virtual network
- **ALB** - Application Load Balancer
- **Route 53** - DNS management
- **CloudFront** - CDN (optional)

### Security
- **IAM** - Identity and access management
- **Security Groups** - Firewall rules
- **Secrets Manager** - Secret storage
- **Systems Manager Parameter Store** - Configuration

### Monitoring
- **CloudWatch** - Logs and metrics
- **X-Ray** - Application tracing (optional)
- **CloudTrail** - Audit logging

### Storage
- **S3** - Object storage (for backups)
- **EBS** - Block storage (for EC2)

## Cost Estimation

### Small Deployment (Development)
- RDS db.t3.micro: ~$15/month
- EC2 t3.micro: ~$8/month
- ALB: ~$20/month
- **Total**: ~$43/month

### Medium Deployment (Production)
- RDS db.t3.small: ~$30/month
- ECS Fargate (2 tasks): ~$30/month
- ALB: ~$20/month
- **Total**: ~$80/month

### Large Deployment (High Traffic)
- RDS db.t3.medium: ~$60/month
- ECS Fargate (5 tasks): ~$75/month
- ALB: ~$20/month
- CloudFront: ~$20/month
- **Total**: ~$175/month

*Prices are estimates and may vary by region*

## Security Best Practices

1. **Never commit AWS credentials**
2. **Use IAM roles for EC2/ECS instead of access keys**
3. **Enable RDS encryption at rest**
4. **Use SSL/TLS for database connections**
5. **Enable VPC security groups**
6. **Use Secrets Manager for sensitive data**
7. **Enable CloudTrail for audit logging**
8. **Regularly update AMIs and containers**

## Monitoring & Alerts

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name finance-app-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Log Monitoring

```bash
# View application logs
aws logs tail /aws/ecs/finance-app --follow
```

## Backup Strategy

### RDS Automated Backups

```bash
# Enable automated backups (7 days retention)
aws rds modify-db-instance \
  --db-instance-identifier finance-app-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### Manual Snapshots

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier finance-app-db \
  --db-snapshot-identifier finance-app-backup-$(date +%Y%m%d)
```

## Disaster Recovery

- **RPO** (Recovery Point Objective): 5 minutes with automated backups
- **RTO** (Recovery Time Objective): 15-30 minutes
- Multi-AZ deployment for high availability
- Regular snapshot testing

## CI/CD Integration

### GitHub Actions + AWS

```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to ECS
        run: |
          # Deployment commands here
```

## Terraform Example (Coming Soon)

Infrastructure as Code for reproducible deployments:

```hcl
# terraform/main.tf
resource "aws_ecs_cluster" "main" {
  name = "finance-app-cluster"
}

resource "aws_db_instance" "main" {
  identifier        = "finance-app-db"
  engine            = "postgres"
  engine_version    = "16.1"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  # ... more configuration
}
```

## Troubleshooting

### Connection Refused to RDS

- Check security group allows traffic from EC2/ECS
- Verify VPC configuration
- Ensure database is in "available" state

### High Latency

- Check if app and database are in same region/AZ
- Review CloudWatch metrics
- Consider RDS read replicas

### Deployment Failures

- Check ECS task logs: `aws ecs describe-tasks`
- Verify IAM roles and permissions
- Check Docker image is accessible

## Migration Guide

### From Local/Docker to AWS

1. **Export Database**
   ```bash
   pg_dump -h localhost -U user -d finance_app > backup.sql
   ```

2. **Import to RDS**
   ```bash
   psql -h your-rds-endpoint -U admin -d finance_app < backup.sql
   ```

3. **Deploy Application**
   - Follow deployment guide above
   - Update environment variables
   - Test thoroughly

## Next Steps

1. **Choose deployment strategy** (EC2, ECS, or EKS)
2. **Set up AWS account** and billing alerts
3. **Create RDS database** instance
4. **Deploy application** following the guide
5. **Configure monitoring** and alerts
6. **Set up CI/CD** for automated deployments

## Additional Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## Contributing

Help us complete this guide:
- Share your AWS deployment experience
- Submit Terraform/CloudFormation templates
- Add troubleshooting tips
- Improve cost optimization strategies

## Related Deployment Options

- [Local Development](../local-prod/README.md)
- [Docker Deployment](../docker/README.md)
- [Vercel Deployment](../vercel/README.md)
- [GCP Deployment](../gcp/README.md)

