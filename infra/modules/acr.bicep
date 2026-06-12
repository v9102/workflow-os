param registryName string
param location string

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01' = {
  name: registryName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: true
  }
}

output loginServer string = registry.properties.loginServer
output username string = registry.name
output password string = listCredentials(registry.id, registry.apiVersion).passwords[0].value
