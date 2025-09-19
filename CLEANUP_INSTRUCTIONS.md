# 🧹 Slack Duplicate Cleanup Instructions

## 📍 **Location**
```bash
cd /Users/admin/Documents/Clients/Everyset/bug-tracker-deployments/bugtracker-dashboard
```

## 🎯 **Current Status**
- **Total Slack records**: 2,137
- **Alessi Hartigan duplicates**: 726 (34%)
- **Production URL duplicates**: 361 (17%)
- **Expected reduction**: ~1,087+ records (50%+ reduction)

## 🛠️ **Cleanup Steps**

### 1. **Authenticate with AWS**
```bash
aws sso login --profile AdministratorAccess12hr-100142810612
```

### 2. **Install Python dependencies** (if needed)
```bash
pip install boto3
```

### 3. **Run Alessi Hartigan cleanup**
```bash
python cleanup_alessi_hartigan.py
```
- **Expected**: Delete ~726 records
- **Pattern**: All Slack records containing "Alessi Hartigan"
- **Safety**: Script asks for confirmation before proceeding

### 4. **Run Production URL cleanup**
```bash
python cleanup_production_urls.py
```
- **Expected**: Delete ~361 records  
- **Pattern**: All Slack records containing "production.everyset.com"
- **Safety**: Script asks for confirmation before proceeding

### 5. **Verify cleanup results**
```bash
python verify_cleanup.py
```
- **Shows**: Final record counts
- **Confirms**: Duplicates removed successfully

## 📊 **Expected Results**
**Before cleanup**: 2,137 Slack records  
**After cleanup**: ~1,050 Slack records  
**Reduction**: ~50% fewer duplicate records

## ⚠️ **Safety Notes**
- Scripts include confirmation prompts
- Run verification script to confirm results
- AWS credentials must be valid (12hr profile)
- Scripts target only specific duplicate patterns

## 🚀 **Next Steps**
After cleanup, refresh your Bug Tracker Dashboard to see the reduced record counts!
