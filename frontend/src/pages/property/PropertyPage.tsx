import React from 'react';
import PropertyList from '../../components/business/PropertyList';

const PropertyPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <PropertyList />
    </div>
  );
};

export default PropertyPage;
