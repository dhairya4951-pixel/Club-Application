import './FormField.css';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  options,
  rows = 4,
}) {
  const id = `field-${name}`;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`form-input form-textarea ${error ? 'form-input--error' : ''}`}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`form-input form-select ${error ? 'form-input--error' : ''}`}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`form-input ${error ? 'form-input--error' : ''}`}
      />
    );
  };

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
