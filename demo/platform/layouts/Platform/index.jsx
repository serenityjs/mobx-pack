import React from 'react';
import CurrentPrice from 'demo/platform/containers/CurrentPrice/index.jsx';
import DealForm from 'demo/platform/containers/DealForm/index.jsx';
import Deals from 'demo/platform/containers/Deals/index.jsx';
import Balance from 'demo/platform/containers/Balance/index.jsx';
import SideBar from 'demo/platform/layouts/SideBar/SideBar.jsx';
import MediaQuery from 'react-responsive';

const Platform = () => (
  <div>
    <div style={{ float: 'left', width: '50%' }}>
      <Balance />
      <CurrentPrice />


      <MediaQuery maxWidth={479}>
        <DealForm />
      </MediaQuery>
      <MediaQuery minWidth={480}>
        <div className="platform-block__left">
          <DealForm />
        </div>
      </MediaQuery>
      <Deals />

    </div>

    <div style={{ float: 'left', width: '50%' }}>
      <SideBar />
    </div>

  </div>
);


export default Platform;

