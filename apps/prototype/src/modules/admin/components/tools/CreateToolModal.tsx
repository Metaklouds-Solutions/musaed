/**
 * Create tool modal. Form for new tool definition.
 */

import { useState } from 'react';
import { Modal, ModalHeader, Button, PopoverSelect } from '../../../../shared/ui';
import type { ToolDefinition } from '../../../../shared/types';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

const CATEGORY_OPTIONS = [
  { value: 'booking', label: 'Booking' },
  { value: 'patient', label: 'Patient' },
  { value: 'communication', label: 'Communication' },
  { value: 'clinic_info', label: 'Clinic Info' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'custom', label: 'Custom' },
];

const EXECUTION_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
];

const HANDLER_OPTIONS = [
  { value: 'query_bookings', label: 'Query Bookings' },
  { value: 'create_booking', label: 'Create Booking' },
  { value: 'cancel_booking', label: 'Cancel Booking' },
  { value: 'reschedule_booking', label: 'Reschedule Booking' },
  { value: 'lookup_patient', label: 'Lookup Patient' },
  { value: 'create_patient', label: 'Create Patient' },
  { value: 'get_business_hours', label: 'Get Business Hours' },
  { value: 'get_services', label: 'Get Services' },
  { value: 'transfer_call', label: 'Transfer Call' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'create_ticket', label: 'Create Ticket' },
];

const DEFAULT_PARAMS = { type: 'object', properties: {} };

interface CreateToolModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ToolDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function CreateToolModal({ open, onClose, onSubmit }: CreateToolModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ToolDefinition['category']>('booking');
  const [executionType, setExecutionType] = useState<ToolDefinition['executionType']>('internal');
  const [handlerKey, setHandlerKey] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [parametersSchemaJson, setParametersSchemaJson] = useState(JSON.stringify(DEFAULT_PARAMS, null, 2));
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [retryOnFail, setRetryOnFail] = useState(false);
  const [scope, setScope] = useState<ToolDefinition['scope']>('platform');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let paramsSchema: Record<string, unknown>;
    try {
      paramsSchema = JSON.parse(parametersSchemaJson);
    } catch {
      paramsSchema = DEFAULT_PARAMS;
    }
    const key = name.trim() || displayName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    onSubmit({
      name: key,
      displayName: displayName.trim() || key,
      description: description.trim(),
      category,
      executionType,
      handlerKey: executionType === 'internal' ? (handlerKey || undefined) : undefined,
      endpointUrl: executionType === 'external' ? (endpointUrl || undefined) : undefined,
      httpMethod: executionType === 'external' ? httpMethod : undefined,
      parametersSchema: paramsSchema,
      timeoutMs,
      retryOnFail,
      scope,
      isActive: true,
      version: 1,
    });
    onClose();
  };

  const SCOPE_OPTIONS = [
    { value: 'platform', label: 'Platform' },
    { value: 'tenant', label: 'Tenant' },
  ];

  const HTTP_METHOD_OPTIONS = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PATCH', label: 'PATCH' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Create Tool" maxWidthRem={40}>
      <ModalHeader title="Create Tool" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Name (key) *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="check_availability" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Display Name *</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Check Availability" className={inputClass} required />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
            <PopoverSelect value={category} onChange={(v) => setCategory(v as ToolDefinition['category'])} options={CATEGORY_OPTIONS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Scope</label>
            <PopoverSelect value={scope} onChange={(v) => setScope(v as ToolDefinition['scope'])} options={SCOPE_OPTIONS} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Execution Type</label>
            <PopoverSelect value={executionType} onChange={(v) => setExecutionType(v as ToolDefinition['executionType'])} options={EXECUTION_OPTIONS} />
          </div>
          {executionType === 'internal' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Handler</label>
              <PopoverSelect value={handlerKey} onChange={setHandlerKey} options={HANDLER_OPTIONS} placeholder="Select handler" />
            </div>
          )}
          {executionType === 'external' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">HTTP Method</label>
              <PopoverSelect value={httpMethod} onChange={setHttpMethod} options={HTTP_METHOD_OPTIONS} />
            </div>
          )}
        </div>
        {executionType === 'external' && (
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Endpoint URL</label>
            <input type="url" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://api.example.com/..." className={inputClass} />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Check availability slots for a given date..." className={inputClass} rows={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Timeout (ms)</label>
            <input type="number" value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value))} min={1000} className={inputClass} />
          </div>
          <div className="flex items-end pb-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="retry" checked={retryOnFail} onChange={(e) => setRetryOnFail(e.target.checked)} />
              <label htmlFor="retry" className="text-sm">Retry on failure</label>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Parameters Schema (JSON)</label>
          <textarea
            value={parametersSchemaJson}
            onChange={(e) => setParametersSchemaJson(e.target.value)}
            className={`${inputClass} font-mono text-xs min-h-[100px]`}
          />
        </div>
        <div className="flex gap-3 pt-2 border-t border-[var(--border-subtle)] mt-4 pt-4">
          <Button type="submit" disabled={!displayName.trim()}>
            Create Tool
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
