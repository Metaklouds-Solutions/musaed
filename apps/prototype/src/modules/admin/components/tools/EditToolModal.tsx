/**
 * Edit tool modal. Pre-populated form for updating tool definition.
 */

import { useState, useEffect } from 'react';
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

interface EditToolModalProps {
  tool: ToolDefinition | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, patch: Partial<Omit<ToolDefinition, 'id' | 'createdAt'>>) => void;
}

export function EditToolModal({ tool, open, onClose, onSubmit }: EditToolModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ToolDefinition['category']>('booking');
  const [executionType, setExecutionType] = useState<ToolDefinition['executionType']>('internal');
  const [handlerKey, setHandlerKey] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [parametersSchemaJson, setParametersSchemaJson] = useState('{}');
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [retryOnFail, setRetryOnFail] = useState(false);

  useEffect(() => {
    if (tool) {
      setDisplayName(tool.displayName);
      setDescription(tool.description);
      setCategory(tool.category);
      setExecutionType(tool.executionType);
      setHandlerKey(tool.handlerKey ?? '');
      setEndpointUrl(tool.endpointUrl ?? '');
      setHttpMethod(tool.httpMethod ?? 'GET');
      setParametersSchemaJson(JSON.stringify(tool.parametersSchema, null, 2));
      setTimeoutMs(tool.timeoutMs);
      setRetryOnFail(tool.retryOnFail);
    }
  }, [tool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool) return;
    let paramsSchema: Record<string, unknown>;
    try {
      paramsSchema = JSON.parse(parametersSchemaJson);
    } catch {
      paramsSchema = tool.parametersSchema;
    }
    onSubmit(tool.id, {
      displayName: displayName.trim(),
      description: description.trim(),
      category,
      executionType,
      handlerKey: executionType === 'internal' ? (handlerKey || undefined) : undefined,
      endpointUrl: executionType === 'external' ? (endpointUrl || undefined) : undefined,
      httpMethod: executionType === 'external' ? httpMethod : undefined,
      parametersSchema: paramsSchema,
      timeoutMs,
      retryOnFail,
    });
    onClose();
  };

  if (!tool) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Tool" maxWidthRem={32}>
      <ModalHeader title={`Edit ${tool.displayName}`} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Display Name *</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
          <PopoverSelect value={category} onChange={(v) => setCategory(v as ToolDefinition['category'])} options={CATEGORY_OPTIONS} />
        </div>
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
          <>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Endpoint URL</label>
              <input type="url" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">HTTP Method</label>
              <PopoverSelect
                value={httpMethod}
                onChange={setHttpMethod}
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PATCH', label: 'PATCH' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                ]}
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Parameters Schema (JSON)</label>
          <textarea
            value={parametersSchemaJson}
            onChange={(e) => setParametersSchemaJson(e.target.value)}
            className={`${inputClass} font-mono text-xs min-h-[100px]`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Timeout (ms)</label>
          <input type="number" value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value))} min={1000} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="retry-edit" checked={retryOnFail} onChange={(e) => setRetryOnFail(e.target.checked)} />
          <label htmlFor="retry-edit" className="text-sm">Retry on failure</label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={!displayName.trim()}>
            Save Changes
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
