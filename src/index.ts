import {
	ApiGetAndListParmas,
	ApiCreateServiceAndUpdateServiceParmas,
	ApiCreateFunctionAndUpdateFunction,
	ApiCreateTriggerAndUpdateTrigger,
	ApiPublishVersionAndCreateAlias,
	ApiCustomDomain,
	ProvisionConfig,
	FunctionAsyncInvokeConfig,
} from './interface'
import BaseComponent from './base'
import yaml from 'js-yaml'
let result: any
let resultData: string[] = []
let _limit: Number | null
let _nextToken, _prefix, _startKey: string | null

export default class FunctionCompute extends BaseComponent {
	constructor(props) {
		super(props)
	}

	/**
	 * 请求list相关api
	 * @param {string} api 判断调用的api
	 * @param {string} field 返回列表数据的固定字段
	 * @param {string} nextToken
	 * @param {number} limit
	 * @param {string} serverName
	 * @param {string} qualifier
	 * @@return {Promise} 返回查询指定api的列表信息
	 */
	private async fetchData(api: string, field: string, nextToken: string, limit: number, serviceName?: string, functionName?: string, qualifier?: number) {
		let optional: any = {
			limit: _limit,
			nextToken: _nextToken,
			prefix: _prefix,
			startKey: _startKey,
		}

		const switchApi = {
			listServices: async () => {
				result = await this.client[api]({ ...optional })
			},
			listFunctions: async () => {
				result = await this.client[api](serviceName, { ...optional }, {}, qualifier)
			},
			listTriggers: async () => {
				result = await this.client[api](serviceName, functionName, { ...optional })
			},
			listAliases: async () => {
				result = await this.client[api](serviceName, { ...optional })
			},
			listVersions: async () => {
				result = await this.client[api](serviceName, { ...optional })
			},
			listCustomDomains: async () => {
				result = await this.client[api]({ ...optional })
			},
			listProvisionConfigs: async () => {
				result = await this.client[api]({ limit: _limit, nextToken: _nextToken, serviceName, qualifier })
			},
			listFunctionAsyncConfigs: async () => {
				result = await this.client[api](serviceName, functionName, { limit: _limit, nextToken: _nextToken })
			},
		}
		await switchApi[api].call(this)
		try {
			do {
				resultData = resultData.concat(result.data[field])
				if (typeof nextToken === 'undefined' && typeof limit === 'undefined') {
					_nextToken = result.data.nextToken ? result.data.nextToken : null
				} else {
					_nextToken = null
				}
			} while (_nextToken)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
		return yaml.dump(resultData)
	}

	/**
	 * 查询服务列表
	 * @param inputs s cli fc listServices
	 */
	public async listServices(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, prefix, startKey } = inputs
		_nextToken = nextToken
		_limit = limit || 100
		_prefix = prefix
		_startKey = startKey
		return this.fetchData('listServices', 'services', nextToken, limit)
	}

	/**
	 * 查询函数列表
	 * @param inputs s cli fc listFunctions -p '{"serviceName": ""}'
	 * @typeParam Required --functionName
	 * @typeParam Optional --qualifier --limit --nextToken --prefix --startKey
	 */
	public async listFunctions(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, prefix, startKey, serviceName, qualifier } = inputs
		if (this.checkField({ serviceName })) return
		_nextToken = nextToken
		_limit = limit || 100
		_prefix = prefix
		_startKey = startKey
		return this.fetchData('listFunctions', 'functions', nextToken, limit, serviceName, null, qualifier)
	}

	/**
	 * 查询触发器列表
	 * @param inputs s cli fc listTriggers -p '{"serviceName": "","functionName": ""}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --limit --nextToken --prefix --startKey
	 */
	public async listTriggers(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, prefix, startKey, serviceName, functionName } = inputs
		if (this.checkField({ serviceName, functionName })) return
		_nextToken = nextToken
		_limit = limit || 100
		_prefix = prefix
		_startKey = startKey
		return this.fetchData('listTriggers', 'triggers', nextToken, limit, serviceName, functionName)
	}

	/**
	 * 查询别名列表
	 * @param inputs s cli fc listAliases -p '{"serviceName": ""}'
	 * @typeParam Required --serviceName
	 * @typeParam Optional --limit --nextToken --prefix --startKey
	 */
	public async listAliases(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, prefix, startKey, serviceName } = inputs
		if (this.checkField({ serviceName })) return
		_nextToken = nextToken
		_limit = limit || 100
		_prefix = prefix
		_startKey = startKey
		return this.fetchData('listAliases', 'aliases', nextToken, limit, serviceName)
	}

	/**
	 * 查询版本列表
	 * @param inputs s cli fc listVersions -p '{"serviceName": ""}'
	 * @typeParam Required --serviceName
	 * @typeParam Optional --limit --nextToken --prefix --startKey
	 */
	public async listVersions(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, prefix, startKey, serviceName } = inputs
		if (this.checkField({ serviceName })) return
		_nextToken = nextToken
		_limit = limit || 100
		_prefix = prefix
		_startKey = startKey
		return this.fetchData('listVersions', 'versions', nextToken, limit, serviceName)
	}

	/**
	 * 查询自定义域名列表
	 * @param inputs s cli fc listCustomDomains
	 * @typeParam Required
	 * @typeParam Optional --limit --nextToken --prefix --startKey
	 */
	public async listCustomDomains(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, prefix, startKey } = inputs
		_nextToken = nextToken
		_limit = limit || 100
		_prefix = prefix
		_startKey = startKey
		return this.fetchData('listCustomDomains', 'customDomains', nextToken, limit)
	}

	/**
	 * 查询预留配置列表
	 * @param inputs s cli fc listProvisionConfigs
	 * @typeParam Required --serviceName
	 * @typeParam Optional --limit --nextToken --prefix --startKey
	 */
	public async listProvisionConfigs(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, serviceName, qualifier } = inputs
		_nextToken = nextToken
		_limit = limit || 100
		return this.fetchData('listProvisionConfigs', 'provisionConfigs', nextToken, limit, serviceName, null, qualifier)
	}

	/**
	 * 查询异步配置列表
	 * @param inputs s cli fc listCustomDomains -p '{"serviceName": "","functionName": ""}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --limit --nextToken
	 */
	public async listFunctionAsyncConfigs(inputs: ApiGetAndListParmas = {}) {
		const { limit, nextToken, serviceName, functionName } = inputs
		if (this.checkField({ serviceName, functionName })) return
		_nextToken = nextToken
		_limit = limit || 100
		return this.fetchData('listFunctionAsyncConfigs', 'configs', nextToken, limit, serviceName, functionName)
	}

	/**
	 * 获取服务配置信息
	 * @param inputs s cli fc getService -p '{"serviceName": ""}'
	 * @typeParam Required --serviceName
	 * @typeParam Optional --qualifier
	 */
	public async getService(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, qualifier } = inputs
		if (this.checkField({ serviceName })) return
		try {
			result = await this.client.getService(serviceName, {}, qualifier)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 获取函数配置信息
	 * @param inputs s cli fc getFunction -p '{"serviceName": "","functionName": ""}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --qualifier
	 */
	public async getFunction(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, qualifier } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.getFunction(serviceName, functionName, {}, qualifier)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 获取函数 Code 信息
	 * @param inputs s cli fc getFunctionCode -p '{"serviceName": "","functionName": ""}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --qualifier
	 */
	public async getFunctionCode(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, qualifier } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.getFunctionCode(serviceName, functionName, {}, qualifier)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 获取触发器配置信息
	 * @param inputs s cli fc getTrigger -p '{"serviceName": "test","functionName": "", "triggerName": ""}'
	 * @typeParam Required --serviceName --functionName --triggerName
	 * @typeParam Optional
	 */
	public async getTrigger(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, triggerName } = inputs
		if (this.checkField({ serviceName, functionName, triggerName })) return
		try {
			result = await this.client.getTrigger(serviceName, functionName, triggerName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 获取 alias 信息
	 * @param inputs s cli fc getAlias -p '{"serviceName": "","aliasName": ""}'
	 * @typeParam Required --serviceName --aliasName
	 * @typeParam Optional
	 */
	public async getAlias(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, aliasName } = inputs
		if (this.checkField({ serviceName, aliasName })) return
		try {
			result = await this.client.getAlias(serviceName, aliasName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 获取自定义域名信息
	 * @param inputs s cli fc getCustomDomain -p '{"domainName": ""}'
	 * @typeParam Required --domainName
	 * @typeParam Optional
	 */
	public async getCustomDomain(inputs: ApiGetAndListParmas = {}) {
		const { domainName } = inputs
		if (this.checkField({ domainName })) return
		try {
			result = await this.client.getCustomDomain(domainName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 获取预留配置信息
	 * @param inputs s cli fc getProvisionConfig -p '{"serviceName": "","functionName": "","qualifier": 1}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --qualifier
	 */
	public async getProvisionConfig(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, qualifier } = inputs
		if (this.checkField({ serviceName, functionName, qualifier })) return
		try {
			result = await this.client.getProvisionConfig(serviceName, functionName, qualifier)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 获取函数异步调用配置信息
	 * @param inputs s cli fc getFunctionAsyncConfig -p '{"serviceName": "","functionName": "","qualifier": 1}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --qualifier
	 */
	public async getFunctionAsyncConfig(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, qualifier } = inputs
		if (this.checkField({ serviceName, functionName, qualifier })) return
		try {
			result = await this.client.getFunctionAsyncConfig(serviceName, functionName, qualifier)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 调用执行函数
	 * @param inputs s cli fc invokeFunction -p '{"serviceName": "","functionName": "","event": {"key":"value"}}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --qualifier --even
	 */
	public async invokeFunction(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, event } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.invokeFunction(serviceName, functionName, JSON.stringify(event))
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 删除服务
	 * @param inputs s cli fc deleteService -p '{"serviceName": ""}'
	 * @typeParam Required --serviceName
	 * @typeParam Optional
	 */
	public async deleteService(inputs: ApiGetAndListParmas = {}) {
		const { serviceName } = inputs
		if (this.checkField({ serviceName })) return
		try {
			result = await this.client.deleteService(serviceName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 删除函数
	 * @param inputs s cli fc deleteFunction -p '{"serviceName": "","functionName": ""}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional
	 */
	public async deleteFunction(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.deleteFunction(serviceName, functionName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 删除触发器
	 * @param inputs s cli fc deleteTrigger -p '{"serviceName": "fcls","functionName":"ggk", "triggerName":"test3"}'
	 * @typeParam Required --serviceName --functionName --triggerName
	 * @typeParam Optional
	 */
	public async deleteTrigger(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, triggerName } = inputs
		if (this.checkField({ serviceName, functionName, triggerName })) return
		try {
			result = await this.client.deleteTrigger(serviceName, functionName, triggerName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 删除自定义域名
	 * @param inputs s cli fc deleteCustomDomain -p '{"domainName": ""}'
	 * @typeParam Required --domainName
	 * @typeParam Optional
	 */
	public async deleteCustomDomain(inputs: ApiGetAndListParmas = {}) {
		const { domainName } = inputs
		if (this.checkField({ domainName })) return
		try {
			result = await this.client.deleteCustomDomain(domainName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 删除版本
	 * @param inputs s cli fc deleteVersion -p '{"serviceName": "","versionId":""}'
	 * @typeParam Required --serviceName --versionId
	 * @typeParam Optional
	 */
	public async deleteVersion(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, versionId } = inputs
		if (this.checkField({ serviceName, versionId })) return
		try {
			result = await this.client.deleteVersion(serviceName, versionId)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 删除别名
	 * @param inputs s cli fc deleteAlias -p '{"serviceName": "","aliasName":""}'
	 * @typeParam Required --serviceName --aliasName
	 * @typeParam Optional
	 */
	public async deleteAlias(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, aliasName } = inputs
		if (this.checkField({ serviceName, aliasName })) return
		try {
			result = await this.client.deleteAlias(serviceName, aliasName)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 删除函数异步配置
	 * @param inputs s cli fc deleteFunctionAsyncConfig -p '{"serviceName": "","functionName": ""}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --qualifier
	 */
	public async deleteFunctionAsyncConfig(inputs: ApiGetAndListParmas = {}) {
		const { serviceName, functionName, qualifier } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.deleteFunctionAsyncConfig(serviceName, functionName, qualifier)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 创建服务
	 * @param inputs s cli fc createService -p '{"serviceName": "","tracingConfig": {"type": "Jaeger","params": {"endpoint":""}}}'
	 * @typeParam Required --serviceName
	 * @typeParam Optional --description --internetAccess --role --logConfig --nasConfig --vpcConfig --tracingConfig
	 */
	public async createService(inputs: ApiCreateServiceAndUpdateServiceParmas = {}) {
		const { serviceName, description, internetAccess, role, logConfig, nasConfig, vpcConfig, tracingConfig } = inputs
		if (this.checkField({ serviceName })) return
		try {
			result = await this.client.createService(serviceName, {
				description,
				internetAccess,
				role,
				logConfig,
				nasConfig,
				vpcConfig,
				tracingConfig,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 更新服务配置
	 * @param inputs  s cli fc updateService -p '{"serviceName": "","tracingConfig": {"type": "Jaeger","params": {"endpoint":""}}}'
	 * @typeParam Required --serviceName
	 * @typeParam Optional --description --internetAccess --role --logConfig --nasConfig --vpcConfig --tracingConfig
	 */
	public async updateService(inputs: ApiCreateServiceAndUpdateServiceParmas = {}) {
		const { serviceName, description, internetAccess, role, logConfig, nasConfig, vpcConfig, tracingConfig } = inputs
		if (this.checkField({ serviceName })) return
		try {
			result = await this.client.updateService(serviceName, {
				description,
				internetAccess,
				role,
				logConfig,
				nasConfig,
				vpcConfig,
				tracingConfig,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 创建函数
	 * @param inputs  s cli fc createFunction -p '{"serviceName": "","functionName": "","handler":"index.handler","runtime": "nodejs10","code":{"ossBucketName": "","ossObjectName":""}}'
	 * @typeParam Required --serviceName --functionName --code --handler --runtime
	 * @typeParam Optional --description --customContainerConfig --initializationTimeout --initializer --memorySize --runtime --timeout --caPort
	 */
	public async createFunction(inputs: ApiCreateFunctionAndUpdateFunction = {}) {
		const { serviceName, functionName, code, customContainerConfig, description, handler, initializationTimeout, initializer, memorySize, runtime, timeout, caPort } = inputs
		if (this.checkField({ serviceName, functionName, code, handler, runtime })) return
		try {
			result = await this.client.createFunction(serviceName, {
				functionName,
				code,
				customContainerConfig,
				description,
				handler,
				initializationTimeout,
				initializer,
				memorySize,
				runtime,
				timeout,
				caPort,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 更新函数
	 * @param inputs  s cli fc updateFunction -p '{"serviceName": "","functionName": "","handler":"index.handler","runtime": "nodejs8","code":{"ossBucketName": "","ossObjectName":""}}'
	 * @typeParam Required --serviceName --functionName
	 * @typeParam Optional --description --customContainerConfig --initializationTimeout --initializer --memorySize --runtime --timeout --caPort --code --handler --runtime
	 */
	public async updateFunction(inputs: ApiCreateFunctionAndUpdateFunction = {}) {
		const { serviceName, functionName, code, customContainerConfig, description, handler, initializationTimeout, initializer, memorySize, runtime, timeout, caPort } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.updateFunction(serviceName, functionName, {
				code,
				customContainerConfig,
				description,
				handler,
				initializationTimeout,
				initializer,
				memorySize,
				runtime,
				timeout,
				caPort,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 创建触发器
	 * @param inputs  s cli fc createTrigger -p '{"serviceName": "","functionName": "","triggerName": "","triggerType":"timer","triggerConfig": {}'
	 * @typeParam Required --serviceName --functionName --triggerName --triggerType
	 * @typeParam Optional --invocationRole --qualifier --sourceArn --triggerConfig
	 */
	public async createTrigger(inputs: ApiCreateTriggerAndUpdateTrigger = {}) {
		const { serviceName, functionName, invocationRole, qualifier, sourceArn, triggerConfig, triggerName, triggerType } = inputs
		if (this.checkField({ serviceName, functionName, triggerName, triggerType, invocationRole })) return
		try {
			result = await this.client.createTrigger(serviceName, functionName, {
				invocationRole,
				qualifier,
				sourceArn,
				triggerConfig,
				triggerName,
				triggerType,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 更新触发器
	 * @param inputs  s cli fc updateTrigger -p '{"serviceName": "","functionName": "","triggerName": "","triggerType":"timer","triggerConfig": {}'
	 * @typeParam Required --serviceName --functionName --triggerName
	 * @typeParam Optional --invocationRole --qualifier --triggerConfig
	 */
	public async updateTrigger(inputs: ApiCreateTriggerAndUpdateTrigger = {}) {
		const { serviceName, functionName, invocationRole, qualifier, triggerConfig, triggerName } = inputs
		if (this.checkField({ serviceName, functionName, triggerName })) return
		try {
			result = await this.client.updateTrigger(serviceName, functionName, triggerName, {
				invocationRole,
				qualifier,
				triggerConfig,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 创建版本
	 * @param inputs  s cli fc publishVersion -p '{"serviceName": "","description": ""}'
	 * @typeParam Required --serviceName --description
	 * @typeParam Optional
	 */
	public async publishVersion(inputs: ApiPublishVersionAndCreateAlias = {}) {
		const { serviceName, description } = inputs
		if (this.checkField({ serviceName })) return
		try {
			result = await this.client.publishVersion(serviceName, description)
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 创建别名
	 * @param inputs  s cli fc createAlias -p '{"serviceName": "","aliasName": "","versionId": "1","additionalVersionWeight": {}}'
	 * @typeParam Required --serviceName --aliasName --versionId
	 * @typeParam Optional --additionalVersionWeight --description
	 */
	public async createAlias(inputs: ApiPublishVersionAndCreateAlias = { additionalVersionWeight: {} }) {
		const { serviceName, aliasName, versionId, additionalVersionWeight, description } = inputs
		if (this.checkField({ serviceName, aliasName, versionId })) return
		try {
			result = await this.client.createAlias(serviceName, aliasName, versionId, {
				additionalVersionWeight,
				description,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 更新别名
	 * @param inputs  s cli fc updateAlias -p '{"serviceName": "","aliasName": "","versionId": "1","additionalVersionWeight": {},"description": ""}'
	 * @typeParam Required --serviceName --aliasName --versionId
	 * @typeParam Optional --additionalVersionWeight --description
	 */
	public async updateAlias(inputs: ApiPublishVersionAndCreateAlias = {}) {
		const { serviceName, aliasName, versionId, additionalVersionWeight, description } = inputs
		if (this.checkField({ serviceName, aliasName, versionId })) return
		try {
			result = await this.client.updateAlias(serviceName, aliasName, versionId, {
				additionalVersionWeight,
				description,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 创建自定义域名
	 * @param inputs  s cli fc createCustomDomain -p '{"serviceName": "","aliasName": "","versionId": "1","additionalVersionWeight": {}}'
	 * @typeParam Required --domainName
	 * @typeParam Optional --protocol --certConfig --routeConfig
	 */
	public async createCustomDomain(inputs: ApiCustomDomain = {}) {
		const { domainName, protocol, certConfig, routeConfig } = inputs
		if (this.checkField({ domainName })) return
		try {
			result = await this.client.createCustomDomain(domainName, {
				protocol,
				certConfig,
				routeConfig,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 更新自定义域名
	 * @param inputs  s cli fc updateCustomDomain -p '{"serviceName": "","aliasName": "","versionId": "1","additionalVersionWeight": {}}'
	 * @typeParam Required --domainName
	 * @typeParam Optional --protocol --certConfig --routeConfig
	 */
	public async updateCustomDomain(inputs: ApiCustomDomain = {}) {
		const { domainName, protocol, certConfig, routeConfig } = inputs
		if (this.checkField({ domainName })) return
		try {
			result = await this.client.updateCustomDomain(domainName, {
				protocol,
				certConfig,
				routeConfig,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 预留配置
	 * @param inputs  s cli fc putProvisionConfig -p '{"serviceName": "","aliasName": "","versionId": "1","additionalVersionWeight": {}}'
	 * @typeParam Required --serviceName --functionName --qualifier
	 * @typeParam Optional --target --scheduledActions --targetTrackingPolicies
	 */
	public async putProvisionConfig(inputs: ProvisionConfig = {}) {
		const { serviceName, functionName, qualifier, target, scheduledActions, targetTrackingPolicies } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.putProvisionConfig(serviceName, functionName, qualifier, {
				target,
				scheduledActions,
				targetTrackingPolicies,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}

	/**
	 * 函数异步配置
	 * @param inputs  s cli f c putFunctionAsyncConfig -p '{"serviceName": "","aliasName": "","versionId": "1","additionalVersionWeight": {}}'
	 * @typeParam Required --serviceName --functionName --qualifier
	 * @typeParam Optional --destinationConfig --maxAsyncEventAgeInSeconds --maxAsyncRetryAttempts
	 */
	public async putFunctionAsyncConfig(inputs: FunctionAsyncInvokeConfig = {}) {
		const { serviceName, functionName, qualifier, destinationConfig, maxAsyncEventAgeInSeconds, maxAsyncRetryAttempts } = inputs
		if (this.checkField({ serviceName, functionName })) return
		try {
			result = await this.client.putFunctionAsyncConfig(serviceName, functionName, qualifier, {
				destinationConfig,
				maxAsyncEventAgeInSeconds,
				maxAsyncRetryAttempts,
			})
			return yaml.dump(result.data)
		} catch (error) {
			this.errorReport(error)
			throw error
		}
	}
}