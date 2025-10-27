import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ClinicalForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    diagnosis: '',
    plan: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-md bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{t('clinical.formTitle')}</h2>

      <label className="block mb-2">
        {t('clinical.patientName')}
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="border rounded w-full p-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        {t('clinical.diagnosis')}
        <input
          type="text"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          className="border rounded w-full p-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        {t('clinical.treatmentPlan')}
        <textarea
          name="plan"
          value={formData.plan}
          onChange={handleChange}
          className="border rounded w-full p-2 mt-1"
        />
      </label>

      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
          {t('clinical.save')}
        </button>
        <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded-md">
          {t('clinical.cancel')}
        </button>
      </div>

      {status === 'success' && (
        <p className="text-green-600 mt-2">{t('clinical.success')}</p>
      )}
      {status === 'error' && (
        <p className="text-red-600 mt-2">{t('clinical.error')}</p>
      )}
    </form>
  );
};
