import React from 'react'
import { useTranslation } from 'react-i18next'
import MaintenanceCard from '../components/MaintenanceCard'
const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div>
      <MaintenanceCard title={t('notFoundTitle')} message={t('notFoundMessage')} />
    </div>
  )
}

export default NotFound
