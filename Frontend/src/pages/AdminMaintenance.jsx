import React from 'react';
import { useTranslation } from 'react-i18next';
import MaintenanceCard from '../components/MaintenanceCard';
import MaintenancePageLoader from '../components/MaintenancePageLoader';

const AdminMaintenance = () => {
  const { t } = useTranslation();

  return (
    <MaintenanceCard
      title={t('adminTitle')}
      message={t('adminMessage')}
    >
      <MaintenancePageLoader />
    </MaintenanceCard>
  );
};

export default AdminMaintenance;
