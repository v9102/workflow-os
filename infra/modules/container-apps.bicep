param environmentName string
param backendAppName string
param frontendAppName string
param location string
param registryName string
param cosmosDbConnectionString string

resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
    }
  }
}

resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: backendAppName
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
      }
      registries: [
        {
          server: '${registryName}.azurecr.io'
          identity: ''
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${registryName}.azurecr.io/workflowos-backend:latest'
          resources: { cpu: 1, memory: '2Gi' }
          env: [
            { name: 'COSMOS_DB_CONNECTION_STRING', value: cosmosDbConnectionString }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: frontendAppName
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${registryName}.azurecr.io/workflowos-frontend:latest'
          resources: { cpu: 0.5, memory: '1Gi' }
          env: [
            { name: 'NEXT_PUBLIC_API_URL', value: 'https://${backendAppName}.${location}.azurecontainerapps.io' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
