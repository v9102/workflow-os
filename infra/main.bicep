param location string = 'eastus'
param environmentName string = 'workflowos'

var resourceGroupName = '${environmentName}-rg'
var cosmosDbAccountName = '${environmentName}-cosmos'
var cosmosDbDatabaseName = '${environmentName}-db'
var cosmosDbContainerName = 'sessions'
var containerAppsEnvironmentName = '${environmentName}-cae'
var backendContainerAppName = '${environmentName}-backend'
var frontendContainerAppName = '${environmentName}-frontend'
var serviceBusNamespaceName = '${environmentName}-sb'
var containerRegistryName = replace('${environmentName}acr', '-', '')

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
}

module cosmosDb './modules/cosmos.bicep' = {
  name: 'cosmos-db'
  scope: rg
  params: {
    accountName: cosmosDbAccountName
    databaseName: cosmosDbDatabaseName
    containerName: cosmosDbContainerName
    location: location
  }
}

module containerRegistry './modules/acr.bicep' = {
  name: 'container-registry'
  scope: rg
  params: {
    registryName: containerRegistryName
    location: location
  }
}

module containerApps './modules/container-apps.bicep' = {
  name: 'container-apps'
  scope: rg
  params: {
    environmentName: containerAppsEnvironmentName
    backendAppName: backendContainerAppName
    frontendAppName: frontendContainerAppName
    location: location
    registryName: containerRegistryName
    cosmosDbConnectionString: cosmosDb.outputs.connectionString
  }
}

module serviceBus './modules/servicebus.bicep' = {
  name: 'service-bus'
  scope: rg
  params: {
    namespaceName: serviceBusNamespaceName
    location: location
  }
}

output backendUrl string = containerApps.outputs.backendUrl
output frontendUrl string = containerApps.outputs.frontendUrl
output cosmosDbConnectionString string = cosmosDb.outputs.connectionString
