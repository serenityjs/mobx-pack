import { isEmpty, each, cloneDeep } from 'lodash';
import { toJS } from 'mobx';
import { protoName } from './util';

class Binder {
  stores = {};

  bind(store, options) {
    const { bindAs } = options;

    if (typeof bindAs !== 'string' || !bindAs.length) {
      this.showMessage(`Store "${protoName(store)}" has not valid "bindAs" id "${bindAs}".`, 'error');
      return;
    }

    if (this.isBinded(bindAs)) {
      this.showMessage(`Store "${bindAs}" was already bind.`, 'warn');
      return;
    }

    this.addStore(store, options);

    if (this.isDebug(bindAs)) {
      this.showMessage(`"${bindAs}" bind.`);
    }

    each(this.stores, (item) => {
      if (item) {
        this.processStore(item, this.getStore(bindAs));
        this.processStore(this.getStore(bindAs), item);
      }
    });

    each(this.stores, (item) => {
      if (item) {
        if (item.bindHash && item.bindHash[bindAs]) {
          this.notifyOnBind(item);
        }
      }
    });

    this.notifyOnBind(this.getStore(bindAs));
  }

  addStore(store, options) {
    const { bindAs } = options;
    const bindHash = {};
    if (options.onBind) {
      options.onBind.forEach((arr) => {
        arr.forEach((storeName) => {
          if (typeof storeName !== 'function') {
            bindHash[storeName] = 1;
          }
        });
      });
    }

    this.stores[bindAs] = {
      bindAs,
      store,
      bindHash,
      options: cloneDeep(options),
      notifyOnBind: {},
      disposers: {
        list: [],
        services: {},
      },
    };
  }

  showMessage(msg, type = 'info') {
    if (type === 'info') {
      console.log(`Binder. ${msg}`);
    } else if (type === 'warn') {
      console.warn(`Binder. ${msg}`);
    } else if (type === 'error') {
      console.error(`Binder. ${msg}`);
    }
  }

  notifyOnBind(store) {
    if (store.options.onBind) {
      store.options.onBind.forEach((onBindItem, index) => {
        let bindCnt = 0;
        const storeList = [];
        const cb = onBindItem[onBindItem.length - 1];
        onBindItem.forEach((storeName) => {
          if (typeof storeName !== 'function') {
            if (this.getStore(storeName).store) {
              bindCnt++;
              storeList.push(this.getStore(storeName).store);
            }
          }
        });
        if (bindCnt === onBindItem.length - 1 && !store.notifyOnBind[index]) {
          let onBindCb = cb;
          if (typeof onBindCb === 'string' && typeof store.store[onBindCb] === 'function') {
            onBindCb = store.store[onBindCb];
          }
          onBindCb.apply(store.store, storeList);
          store.notifyOnBind[index] = true;
        }
      });
    }
  }

  isDebug(bindAs) {
    const s = this.getStore(bindAs);
    return s && s.options ? s.options.debug : false;
  }

  processStore(from, to) {
    if (from.bindAs !== to.bindAs) {
      const { importData } = to.options;

      if (importData && importData[from.bindAs]) {
        each(importData[from.bindAs], (toVarName, fromVarName) => {
          if (!(fromVarName in from.store)) {
            this.showMessage(`Variable "${fromVarName}" required for "${to.bindAs}" 
            not found in "${from.bindAs}"`, 'warn');
            return;
          }

          if (toVarName in to.store) {
            this.showMessage(`Trying create link from "${from.bindAs}.${fromVarName}" 
            to "${to.bindAs}.${toVarName}", but variable "${toVarName}" is already exist in "${to.bindAs}"`, 'warn');
            return;
          }

          Object.defineProperty(to.store, toVarName, {
            get: () => {
              if (this.isDebug(to.bindAs)) {
                this.showMessage(`Variable "${fromVarName}" from "${from.bindAs}" 
              was taken by "${to.bindAs}" with name "${toVarName}"`);
              }

              return from.store[fromVarName];
            },
            configurable: true,
          });
        });
      }
    }
  }

  addDisposer(bindAs, services, obsr) {
    const storeSettings = this.getStore(bindAs);
    let pass = true;

    services.forEach((serviceName) => {
      if (!this.isBinded(serviceName)) {
        this.showMessage(`Imposible add disposer for not bind service "${bindAs}".`, 'warn');
        pass = false;
      }
    });

    if (pass) {
      storeSettings.disposers.list.push(obsr);

      services.forEach((serviceName) => {
        if (!storeSettings.disposers.services[serviceName]) {
          storeSettings.disposers.services[serviceName] = [];
        }

        storeSettings.disposers.services[serviceName].push(storeSettings.disposers.list.length - 1);
      });
    }

    return pass;
  }

  isBinded(bindAs) {
    return !!(this.stores[bindAs] && this.stores[bindAs].store);
  }

  getStore(bindAs) {
    return this.stores[bindAs] || {};
  }

  unbind(bindAs) {
    const storeSettings = this.getStore(bindAs);

    if (isEmpty(storeSettings)) {
      this.showMessage(`Not binded store "${bindAs}" try to unbind!`, 'warn');
      return;
    }

    // unbind data exporting to other stores
    each(this.stores, (item) => {
      if (item) {
        const importData = item.options.importData && item.options.importData[bindAs];
        if (importData) {
          // console.log(['unbind data exporting to other stores', item.bindAs, importData]);
          this.unbindData(item.bindAs, importData);
        }
      }
    });

    // unbind data importing from other stores
    if (storeSettings.options.importData) {
      each(storeSettings.options.importData, (importData) => {
        this.unbindData(bindAs, importData);
      });
    }

    // unbind disposers in this store
    storeSettings.disposers.list.forEach((disposer) => {
      if (typeof disposer === 'function') {
        disposer();
      }
    });

    // unbind disposers in other stores
    this.unbindDisposers(bindAs);

    // clear store settings in binder
    this.stores[bindAs] = undefined;

    if (this.isDebug(bindAs)) {
      this.showMessage(`"${bindAs}" unbind.`);
    }
  }

  unbindData(bindAs, importData) {
    const { store } = this.getStore(bindAs);
    each(importData, (toVarName) => {
      if (toVarName in store) {
        Object.defineProperty(store, toVarName, { value: undefined });
      }
    });
  }

  unbindDisposers(bindAs) {
    each(this.stores, (store) => {
      if (store && store.disposers.services[bindAs]) {
        store.disposers.services[bindAs].forEach((disposer) => {
          if (typeof store.disposers.list[disposer] === 'function') {
            store.disposers.list[disposer]();
            store.disposers.list[disposer] = undefined;
          }
        });
      }
    });
  }

  /**
   * Отдаёт значение переменной из стора, привязанного к биндеру
   * @public
   * @param {string} storeName
   * @param {string} varName
   * @param {string} initiator
   * @param {boolean} raw
   * @returns {mixed}
   */

  importVar(storeName, varName, initiator, raw) {
    const s = this.getStore(storeName);
    const store = s && s.store ? s.store : null;
    let val;
    let exportData;

    if (s && s.store) {
      exportData = s.options.exportData;

      if (exportData && !exportData[varName]) {
        console.warn(`Warnning! Impossible import variable "${varName}" of 
        "${s.bindAs}" for "${initiator}" because variable is not included to config.exportData.`);
        return;
      }

      val = store[varName];
      if (s.debug) {
        console.log(`Binder. "${initiator}" import variable "${varName}" from "${storeName}".`, val);
      }
      return raw ? val : toJS(val); // eslint-disable-line
    }

    console.warn(`Warnning! importVar form "${protoName(this)}" to "${initiator}". "${storeName}" store not found.`);

    return undefined; // eslint-disable-line
  }

  /**
   * Вызвает метод описанный в api стора с параметрами
   * @public
   * @param {string} storeName
   * @param {string} actionName
   * @param {string} initiator
   * @param {array} arg
   */
  callApi(storeName, actionName, initiator, ...arg) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const s = this.getStore(storeName);
    let storeInst;

    if (s && s.store) {
      storeInst = s.store;

      if (s.options.debug) {
        console.log(`Binder callApi. "${initiator}" calls method "${actionName}" from "${storeName}".`, arg);
      }

      if (storeInst.api && storeInst.api[actionName]) {
        return storeInst.api[actionName].apply(storeInst, arg); // eslint-disable-line
      }
      console.warn(`CallApi warn. "${initiator}" calls unknown method "${actionName}" found in store "${storeName}".`);


      // s.store[actionName].apply(s.store, arg);
    } else {
      console.warn(`CallApi warn. "${initiator}" calls method "${actionName}" from not bind store "${storeName}".`);
    }
  }
}

export default Binder;

