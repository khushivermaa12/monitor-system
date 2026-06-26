import React from 'react';
import { useTranslation } from 'react-i18next';
import MaintenanceCard from '../components/MaintenanceCard';
import MaintenancePageLoader from '../components/MaintenancePageLoader';

const UserMaintenance = () => {
  const { t } = useTranslation();

  return (
    <MaintenanceCard
      title={t('userTitle')}
      message={t('userMessage')}
    >
      <MaintenancePageLoader />
    </MaintenanceCard>
  );
};

export default UserMaintenance;
