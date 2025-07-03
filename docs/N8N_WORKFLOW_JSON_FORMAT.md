# n8n Workflow JSON Format Documentation

## 📋 **Overview**

This document provides the **definitive guide** for creating n8n workflow JSON files that are compatible with current n8n versions. This is based on analysis of working n8n exports and addresses common formatting issues.

## 🔧 **Root Workflow Structure**

```json
{
  "name": "My workflow",
  "nodes": [...],
  "pinData": {},
  "connections": {...},
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "uuid-string",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "long-hash-string"
  },
  "id": "workflow-id",
  "tags": [...]
}
```

### **Key Root Fields:**
- **`name`**: Human-readable workflow name
- **`nodes`**: Array of workflow nodes
- **`connections`**: Object defining node connections
- **`active`**: Boolean for workflow activation status
- **`settings`**: Workflow execution settings
- **`versionId`**: UUID for version tracking
- **`meta`**: Metadata object with instance info
- **`id`**: Unique workflow identifier
- **`tags`**: Array of tag objects

## 🎯 **Node Structure**

### **Universal Node Format:**
```json
{
  "parameters": {...},
  "id": "uuid-format-id",
  "name": "Node Display Name",
  "type": "n8n-nodes-base.nodeType",
  "typeVersion": 1,
  "position": [x, y],
  "credentials": {...} // Optional
}
```

### **Critical Node Requirements:**
- **`id`**: Must be UUID format (e.g., `"4603ff7e-7e69-4ab9-aca4-77ca8aab2a58"`)
- **`position`**: Array format `[x, y]`, NOT object `{x, y}`
- **`typeVersion`**: Always integer, typically `1`
- **`type`**: Full node type with `n8n-nodes-base.` prefix

## 🤖 **OpenAI Node Configuration**

### **✅ CORRECT OpenAI Node Format:**
```json
{
  "parameters": {
    "resource": "chat",
    "model": "gpt-4.1-mini",
    "prompt": {
      "messages": [
        {
          "content": "=Your prompt content with expressions like {{ $node[\"Node Name\"].json[\"field\"] }}"
        }
      ]
    },
    "options": {},
    "requestOptions": {}
  },
  "id": "uuid-here",
  "name": "OpenAI Node Name",
  "type": "n8n-nodes-base.openAi",
  "typeVersion": 1,
  "position": [x, y],
  "credentials": {
    "openAiApi": {
      "id": "credential-id",
      "name": "OpenAi account"
    }
  }
}
```

### **🚨 CRITICAL OpenAI Requirements:**
1. **NO `operation` field** - This was our main error!
2. **Use `prompt.messages` array** - NOT `messages.messageValues`
3. **Include `model` parameter** directly in parameters
4. **Always include `options: {}`** and `requestOptions: {}`
5. **Must have `credentials` field** with API reference
6. **Use `resource: "chat"`** for chat completions

### **❌ INVALID OpenAI Formats:**
```json
// ❌ DON'T USE THESE:
{
  "operation": "Complete",           // ❌ No operation field
  "messages": {                      // ❌ Wrong message structure
    "messageValues": [...]
  }
}
```

## 📝 **Set Node Configuration**

### **✅ CORRECT Set Node Format:**
```json
{
  "parameters": {
    "values": {
      "string": [
        {
          "name": "fieldName",
          "value": "={{ $json.body.fieldName }}"
        }
      ],
      "number": [
        {
          "name": "numericField", 
          "value": 123
        }
      ]
    },
    "options": {}
  },
  "type": "n8n-nodes-base.set"
}
```

### **Set Node Requirements:**
- Use **`values.string`** and **`values.number`** arrays
- Include **`options: {}`** field
- Each value has **`name`** and **`value`** properties

## 🔗 **Webhook Node Configuration**

### **✅ CORRECT Webhook Format:**
```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "your-endpoint",
    "responseMode": "responseNode",
    "options": {}
  },
  "type": "n8n-nodes-base.webhook",
  "webhookId": "unique-webhook-id"
}
```

## 💻 **Code Node Configuration**

### **✅ CORRECT Code Node Format:**
```json
{
  "parameters": {
    "jsCode": "// Your JavaScript code here\nreturn [{...}];"
  },
  "type": "n8n-nodes-base.code"
}
```

## 🔀 **IF Node Configuration**

### **✅ CORRECT IF Node Format:**
```json
{
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.field }}",
          "value2": true
        }
      ]
    }
  },
  "type": "n8n-nodes-base.if"
}
```

## 📡 **Respond to Webhook Node**

### **✅ CORRECT Response Node Format:**
```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ JSON.stringify($json, null, 2) }}",
    "options": {
      "responseHeaders": {
        "entries": [
          {
            "name": "Content-Type",
            "value": "application/json"
          },
          {
            "name": "Access-Control-Allow-Origin",
            "value": "*"
          }
        ]
      }
    }
  },
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1.1
}
```

## 🔌 **Connections Structure**

### **✅ CORRECT Connections Format:**
```json
{
  "connections": {
    "Node Name 1": {
      "main": [
        [
          {
            "node": "Node Name 2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Conditional Node": {
      "main": [
        [
          {
            "node": "True Path Node",
            "type": "main", 
            "index": 0
          }
        ],
        [
          {
            "node": "False Path Node",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### **Connection Requirements:**
- Use **exact node names** as keys
- **`main`** array contains connection arrays
- Each connection has **`node`**, **`type`**, **`index`**
- Multiple outputs use multiple sub-arrays

## 🏷️ **Tags Structure**

### **✅ CORRECT Tags Format:**
```json
{
  "tags": [
    {
      "createdAt": "2025-07-02T22:09:42.701Z",
      "updatedAt": "2025-07-02T22:09:42.701Z", 
      "id": "unique-tag-id",
      "name": "tag-name"
    }
  ]
}
```

## 🆔 **Credentials Structure**

### **✅ CORRECT Credentials Format:**
```json
{
  "credentials": {
    "openAiApi": {
      "id": "credential-uuid",
      "name": "OpenAi account"
    }
  }
}
```

## ⚡ **Expression Syntax**

### **✅ CORRECT Expression Examples:**
```javascript
// Node reference
"={{ $node[\"Node Name\"].json[\"fieldName\"] }}"

// JSON body access
"={{ $json.body.transcript }}"

// Conditional expression
"={{ $json.body.sessionId || 'default' }}"

// JSON stringify
"={{ JSON.stringify($json, null, 2) }}"

// Array join
"={{ $node[\"Parse Analysis\"].json[\"reasons\"].join(\"; \") }}"
```

## 🚨 **Common Pitfalls to Avoid**

### **❌ Invalid Configurations:**

1. **Wrong OpenAI Format:**
```json
// ❌ DON'T USE:
{
  "operation": "Complete",
  "messages": {
    "messageValues": [...]
  }
}
```

2. **Wrong Position Format:**
```json
// ❌ DON'T USE:
"position": {"x": 100, "y": 200}

// ✅ USE:
"position": [100, 200]
```

3. **Wrong Node ID Format:**
```json
// ❌ DON'T USE:
"id": "simple-id"

// ✅ USE:
"id": "4603ff7e-7e69-4ab9-aca4-77ca8aab2a58"
```

4. **Missing Required Fields:**
```json
// ❌ Missing in OpenAI nodes:
"credentials": {...},
"options": {},
"requestOptions": {}
```

## 🔄 **Version Compatibility**

### **Working Configuration:**
- **n8n Version**: Latest (2024+)
- **Node TypeVersion**: `1` for most nodes, `1.1` for webhooks
- **OpenAI Node**: Uses `prompt.messages` format
- **UUID Format**: For all node IDs and credentials

## 📋 **Validation Checklist**

### **Before Import, Verify:**
- [ ] All node IDs are UUID format
- [ ] Positions are arrays `[x, y]`
- [ ] OpenAI nodes have NO `operation` field
- [ ] OpenAI nodes use `prompt.messages` structure
- [ ] All nodes have `options: {}` where required
- [ ] Credentials are properly referenced
- [ ] Connections use exact node names
- [ ] All required fields are present

## 💡 **Pro Tips**

1. **Always export working workflows** from n8n to see correct format
2. **Test imports immediately** after making JSON changes
3. **Use UUID generators** for new node IDs
4. **Copy credential structures** from working exports
5. **Validate JSON syntax** before importing
6. **Keep backups** of working workflow files

## 🔧 **Troubleshooting Import Issues**

### **Common Error Messages:**
- **"Node not found"**: Check node type and typeVersion
- **"Invalid node configuration"**: Verify parameter structure
- **"Credential not found"**: Update credential IDs
- **"Invalid connections"**: Check node name references

### **Debug Steps:**
1. Export a simple working workflow
2. Compare structure with your JSON
3. Fix one node type at a time
4. Test import after each fix
5. Use browser dev tools for detailed errors

---

**📚 Reference**: This documentation is based on analysis of working n8n workflow exports from version 1.0+ and addresses common compatibility issues with programmatically generated workflows. 