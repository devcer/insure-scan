/**
 * PolicyForm Component
 * Premium policy form with validation, floating labels, and smooth animations
 */

import React, { useState, useEffect } from 'react';
import { PremiumModal } from './PremiumModal';
import { PremiumInput, PremiumTextarea, PremiumSelect } from './PremiumInput';
import { PremiumButton } from './PremiumButton';
import { cn } from '../utils/cn';
import { getInsuranceIcon, getInsuranceTypeColor } from './icons/InsuranceIcons';

export interface PolicyFormData {
  insurerName: string;
  policyNumber: string;
  amount: string;
  dueDate: string;
  paymentStatus: string;
  emailSubject: string;
  insuranceType: string;
}

export interface PolicyFormProps {
  /** Whether the form modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler */
  onSubmit: (data: PolicyFormData) => Promise<void>;
  /** Initial form data for editing */
  initialData?: Partial<PolicyFormData>;
  /** Whether this is an edit form */
  isEditing?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * Form validation rules
 */
const validateForm = (data: PolicyFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.insurerName.trim()) {
    errors.insurerName = 'Insurance company name is required';
  } else if (data.insurerName.length < 2) {
    errors.insurerName = 'Company name must be at least 2 characters';
  }

  if (data.amount && isNaN(parseFloat(data.amount))) {
    errors.amount = 'Please enter a valid amount';
  } else if (data.amount && parseFloat(data.amount) < 0) {
    errors.amount = 'Amount cannot be negative';
  }

  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      // Allow past dates but show a warning
      // errors.dueDate = 'Due date cannot be in the past';
    }
  }

  if (data.policyNumber && data.policyNumber.length > 50) {
    errors.policyNumber = 'Policy number is too long';
  }

  return errors;
};

/**
 * Insurance type options
 */
const insuranceTypeOptions = [
  { value: 'Health Insurance', label: 'Health Insurance' },
  { value: 'Life Insurance', label: 'Life Insurance' },
  { value: 'Vehicle Insurance', label: 'Vehicle Insurance' },
  { value: 'Home Insurance', label: 'Home Insurance' },
  { value: 'Travel Insurance', label: 'Travel Insurance' },
  { value: 'Business Insurance', label: 'Business Insurance' },
  { value: 'General Insurance', label: 'General Insurance' },
];

/**
 * Payment status options
 */
const paymentStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

/**
 * PolicyForm component with premium styling and validation
 */
export const PolicyForm: React.FC<PolicyFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PolicyFormData>({
    insurerName: '',
    policyNumber: '',
    amount: '',
    dueDate: '',
    paymentStatus: 'PENDING',
    emailSubject: '',
    insuranceType: 'General Insurance',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          insurerName: initialData.insurerName || '',
          policyNumber: initialData.policyNumber || '',
          amount: initialData.amount || '',
          dueDate: initialData.dueDate || '',
          paymentStatus: initialData.paymentStatus || 'PENDING',
          emailSubject: initialData.emailSubject || '',
          insuranceType: initialData.insuranceType || 'General Insurance',
        });
      } else {
        setFormData({
          insurerName: '',
          policyNumber: '',
          amount: '',
          dueDate: '',
          paymentStatus: 'PENDING',
          emailSubject: '',
          insuranceType: 'General Insurance',
        });
      }
      setErrors({});
      setSubmitSuccess(false);
    }
  }, [isOpen, initialData]);

  // Auto-detect insurance type from company name
  useEffect(() => {
    if (formData.insurerName && !isEditing) {
      const name = formData.insurerName.toLowerCase();
      let detectedType = 'General Insurance';

      if (name.includes('health') || name.includes('medical') || name.includes('care')) {
        detectedType = 'Health Insurance';
      } else if (name.includes('life') || name.includes('lic')) {
        detectedType = 'Life Insurance';
      } else if (name.includes('vehicle') || name.includes('car') || name.includes('motor') || name.includes('auto')) {
        detectedType = 'Vehicle Insurance';
      } else if (name.includes('home') || name.includes('property')) {
        detectedType = 'Home Insurance';
      } else if (name.includes('travel')) {
        detectedType = 'Travel Insurance';
      }

      if (detectedType !== formData.insuranceType) {
        setFormData(prev => ({ ...prev, insuranceType: detectedType }));
      }
    }
  }, [formData.insurerName, isEditing]);

  const handleInputChange = (field: keyof PolicyFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      setSubmitSuccess(true);

      // Close modal after success animation
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
      }, 1500);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save policy'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const InsuranceIcon = getInsuranceIcon(formData.insuranceType);
  const typeColors = getInsuranceTypeColor(formData.insuranceType);

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Policy' : 'Add New Policy'}
      size="lg"
      preventBackdropClose={isSubmitting}
      preventEscapeClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="p-6">
        {/* Success animation */}
        {submitSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl animate-scale-in">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {isEditing ? 'Policy Updated!' : 'Policy Created!'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your policy has been saved successfully.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form header with insurance type preview */}
        <div className="mb-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-3 rounded-xl border transition-all duration-200',
              typeColors.bg,
              typeColors.border
            )}>
              <InsuranceIcon className={cn('w-6 h-6', typeColors.icon)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {formData.insuranceType}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formData.insurerName || 'Enter company name to get started'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Name */}
          <PremiumInput
            label="Insurance Company"
            value={formData.insurerName}
            onChange={handleInputChange('insurerName')}
            placeholder="e.g., HDFC Life Insurance"
            required
            error={errors.insurerName}
            help="Enter the name of your insurance company"
          />

          {/* Insurance Type */}
          <PremiumSelect
            label="Insurance Type"
            value={formData.insuranceType}
            onChange={handleInputChange('insuranceType')}
            options={insuranceTypeOptions}
            help="This will be auto-detected from the company name"
          />

          {/* Policy Number */}
          <PremiumInput
            label="Policy Number"
            value={formData.policyNumber}
            onChange={handleInputChange('policyNumber')}
            placeholder="e.g., POL123456789"
            error={errors.policyNumber}
            help="Optional - Your policy reference number"
          />

          {/* Amount and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumInput
              label="Annual Premium"
              type="number"
              value={formData.amount}
              onChange={handleInputChange('amount')}
              placeholder="50000"
              min={0}
              step={0.01}
              error={errors.amount}
              help="Enter amount in ₹"
            />

            <PremiumInput
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange('dueDate')}
              error={errors.dueDate}
              help="When is the next payment due?"
            />
          </div>

          {/* Payment Status */}
          <PremiumSelect
            label="Payment Status"
            value={formData.paymentStatus}
            onChange={handleInputChange('paymentStatus')}
            options={paymentStatusOptions}
            help="Current status of your premium payment"
          />

          {/* Notes/Summary */}
          <PremiumTextarea
            label="Notes & Summary"
            value={formData.emailSubject}
            onChange={handleInputChange('emailSubject')}
            placeholder="Add any notes or summary about this policy..."
            rows={4}
            help="Optional - Any additional information about this policy"
          />
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.submit}
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 flex gap-4 justify-end">
          <PremiumButton
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </PremiumButton>
          <PremiumButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            glow
            className="min-w-[120px]"
          >
            {isEditing ? 'Update Policy' : 'Create Policy'}
          </PremiumButton>
        </div>
      </form>
    </PremiumModal>
  );
};

export default PolicyForm;
