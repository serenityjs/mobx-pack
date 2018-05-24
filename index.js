/*const modules = {
  Binder: require('./lib/Binder').default,
  ServiceStarter: require('./lib/ServiceStarter').default,
  BaseStore: require('./lib/BaseStore').default,
  BaseComponent: require('./lib/BaseComponent').default,
  Connector: require('./lib/Connector').default,
};


exports.Binder = modules.Binder;
exports.ServiceStarter = modules.ServiceStarter;
exports.BaseStore = modules.BaseStore;
exports.BaseComponent = modules.BaseComponent;
exports.Connector = modules.Connector;

module.exports = modules;*/


import BaseComponent from 'src/lib/BaseComponent.jsx';
import BaseStore from 'src/lib/BaseStore.js';
import Binder from 'src/lib/Binder.js';
import Connector from 'src/lib/Connector.jsx';
import ServiceStarter from 'src/lib/ServiceStarter.js';


export {BaseComponent, BaseStore, Binder, Connector, ServiceStarter}



