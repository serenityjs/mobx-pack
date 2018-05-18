import { observable, action, reaction } from 'mobx';
import { BaseStore } from 'src/index.js';
import { RECHARGE_SERVICE }
  from 'demo/platform/constants/moduleNames.js';

export default class BalanceStore extends BaseStore {
  config = {
    bindAs: ' BalanceStore',

    onBind: [[RECHARGE_SERVICE, () => {
      this.initRecharge();
    }]],
  };

  @observable isRecharge = false;
  @observable bonusPercent = 0;
  @observable defaultAmount = 0;

  api = {
    recharge: this.recharge,
  };

  @action initRecharge() {

  /*  this.addObservers([
      reaction(
        () => {
          return [
            this.importVar(RECHARGE_SERVICE, 'bonusPercent', true),
            this.importVar(RECHARGE_SERVICE, 'defaultAmount', true),
          ];
        },
        ([bonusPercent, defaultAmount]) => {
          console.log([this.bonusPercent, bonusPercent, this.defaultAmount, defaultAmount]);
          setTimeout(()=>{

            this.bonusPercent = bonusPercent;
            this.defaultAmount = defaultAmount;
          }, 1000);

        }, true
      ),
    ]);*/


    this.isRecharge = true;

    console.log(['this.isRecharge', this.isRecharge]);
  }

  @action recharge() {
    if (this.isRecharge) {
      this.callApi(RECHARGE_SERVICE, 'recharge', this.defaultAmount);
    }
  }
}

