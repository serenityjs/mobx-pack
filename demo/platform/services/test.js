import { BaseStore } from 'src/index.js';
import context from 'demo/platform/helper/context.js';


export class BaseService extends BaseStore {
  config = {
    bindAs: 'test',
  };

  data = 1;

  onStart(){

    this.data = 3;
    return true;
  }
}

export default new BaseService(context);
