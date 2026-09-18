@description('Globally unique web app name. Confirm pricing and credit eligibility before provisioning.')
param appName string
param location string = resourceGroup().location

@secure()
param mongodbUri string
@secure()
@minLength(32)
param jwtSecret string

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appCommandLine: 'node apps/api/dist/server.js'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      healthCheckPath: '/api/health/ready'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'APP_ORIGIN'
          value: 'https://${appName}.azurewebsites.net'
        }
        {
          name: 'MONGODB_URI'
          value: mongodbUri
        }
        {
          name: 'JWT_SECRET'
          value: jwtSecret
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
      ]
    }
  }
}

output url string = 'https://${app.properties.defaultHostName}'
output outboundAddresses string = app.properties.possibleOutboundIpAddresses
