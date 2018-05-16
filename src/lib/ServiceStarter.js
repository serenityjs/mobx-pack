import { each } from 'lodash';

export default class ServiceStarter {
  stratedServices = {};
  waiters = {};

  register(service) {
    const conf = service.getConfig();

    if (conf.bindAs) {
      this.stratedServices[conf.bindAs] = service;
    }
    this.processExpected(service);
  }


  waitFor(service) {
    let result = false;
    const conf = service.getConfig();
    let promises;
    let depsError;

    const waitForList = this.getWaitForList(conf.importData);

    if ((typeof conf.waitFor === 'undefined' || conf.waitFor === true) && waitForList.length) {
      depsError = this.chekDeps(conf.bindAs, waitForList, this.waiters);

      if (!depsError) {
        promises = this.processWaiting(service);
        result = promises.length ? Promise.all(promises) : false;
      } else {
        console.error(`ServiceStarter error. "${conf.bindAs}": ${depsError}.`);
      }
    }

    return result;
  }

  getWaitForList(importData) {
    const keys = {};
    const waitForList = [];
    each(importData, (value, key) => {
      if (!keys[key]) {
        waitForList.push(key);
      }
      keys[key] = 1;
    });
    return waitForList;
  }

  getNotStartedServices(service){
    const conf = service.getConfig();
    const waitForList = this.getWaitForList(conf.importData);
    const result = [];
    waitForList.forEach((item) => {
      if (!this.stratedServices[item]) {
        result.push(item);
      }
    });
    return result.length ? result : null;
  }

  processWaiting(service) {
    const conf = service.getConfig();
    let result = false;
    const waitForList = this.getWaitForList(conf.importData);

    waitForList.forEach((item) => {
      if (!this.stratedServices[item]) {
        if (!result) {
          result = [];
        }

        result.push(new Promise(
          (resolve, reject) => {
            this.addWaiter(service, item, resolve, reject);
          },
        ));
      }
    });
    return result;
  }
  processExpected(service) {
    const conf = service.getConfig();
    const waiters = this.waiters[conf.bindAs];
    if (waiters && waiters.length) {
      waiters.forEach((item) => {
        item.resolve();
      });
    }
  }

  addWaiter(waiterService, expected, resolve, reject) {
    if (!this.waiters[expected]) {
      this.waiters[expected] = [];
    }
    this.waiters[expected].push({ waiterService, resolve, reject });
  }
  /* eslint-disable */
  goByChain(hash, entry, currentPoint, chain) {
    if (!chain[currentPoint]) {
      chain[currentPoint] = 1;
      for (const point in hash[currentPoint]) {
        if (!hash[currentPoint].hasOwnProperty(point)) {
          continue;
        }
        if (point !== entry) {
          return this.goByChain(hash, entry, point, chain);
        }

        return `Loading conflict with"${entry}"`;
      }
    }
  }
  /* eslint-enable */
  chekDeps(bindAs, waitFor, waiters) {
    let result = false;
    const chain = {};
    const hash = {};

    if (waitFor.length) {
      each(waiters, (data, service) => {
        data.forEach((item) => {
          const conf = item.waiterService.getConfig();
          const waiterName = conf.bindAs;

          if (!hash[waiterName]) {
            hash[waiterName] = {};
          }
          hash[waiterName][service] = 1;
        });
      });

      if (!hash[bindAs]) {
        hash[bindAs] = {};
      }

      waitFor.forEach((item) => {
        hash[bindAs][item] = 1;
      });
    }

    each(hash, (data, point) => {
      const error = this.goByChain(hash, point, point, chain);
      if (error) {
        result = error;
      }
    });

    return result;
  }
}

