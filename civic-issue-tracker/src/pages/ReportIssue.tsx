// Report Issue Form - Allows civilians to submit new cases with photo validation

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import config from '../config';

const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!config.allowedImageTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG or PNG)');
      return;
    }

    // Validate file size
    if (file.size > config.maxImageSize) {
      setError(`Image size must be less than ${config.maxImageSize / 1024 / 1024}MB`);
      return;
    }

    setPhoto(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }

    if (!formData.location.trim()) {
      setError('Please provide the location of the issue');
      return;
    }

    if (!photo) {
      setError('Please upload a photo of the issue for validation');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.reportCase({
        description: formData.description,
        location: formData.location,
        photo: photo,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
      });

      setSuccess(true);
      setReferenceNumber(response.referenceNumber);

      // Clear form
      setFormData({
        description: '',
        location: '',
        contactEmail: '',
        contactPhone: '',
      });
      setPhoto(null);
      setPhotoPreview(null);

    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container">
        <div className="success-page">
          <div className="success-icon">✓</div>
          <h1>Report Submitted Successfully!</h1>
          <p className="success-message">
            Your issue has been reported and is pending review by our officials.
          </p>
          {referenceNumber && (
            <div className="reference-number">
              <p>Your reference number:</p>
              <h2>{referenceNumber}</h2>
              <p className="help-text">
                Save this number to track your report. You can search for it on the public cases page.
              </p>
            </div>
          )}
          <div className="success-actions">
            <button onClick={() => navigate('/cases')} className="btn btn-primary">
              View All Cases
            </button>
            <button onClick={() => setSuccess(false)} className="btn btn-secondary">
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Report a Community Issue</h1>
        <p className="subtitle">
          Help improve our community by reporting issues. All reports require a photo for validation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="report-form">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="description" className="required">
            Issue Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the issue in detail..."
            rows={4}
            required
            className="form-control"
          />
          <p className="help-text">
            Be specific about what the problem is and any relevant details.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="location" className="required">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., 123 Main Street, Springfield or intersection of Oak Ave and 1st St"
            required
            className="form-control"
          />
          <p className="help-text">
            Provide the address or a clear description of where the issue is located.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="photo" className="required">
            Photo of Issue
          </label>
          <div className="photo-upload-area">
            {!photoPreview ? (
              <label htmlFor="photo" className="photo-upload-label">
                <div className="upload-icon">📷</div>
                <p>Click to upload photo</p>
                <p className="help-text">JPEG or PNG, max 5MB</p>
              </label>
            ) : (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="btn-remove-photo"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              type="file"
              id="photo"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handlePhotoChange}
              required
              className="photo-input"
              style={{ display: 'none' }}
            />
          </div>
          <p className="help-text">
            A photo is required to validate your report and help officials understand the issue.
          </p>
        </div>

        <div className="form-section-divider">
          <h3>Contact Information (Optional)</h3>
          <p className="help-text">
            Provide your contact info to receive updates, or remain anonymous.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="contactEmail">Email</label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactPhone">Phone Number</label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            placeholder="(555) 123-4567"
            className="form-control"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !photo}
            className="btn btn-primary btn-large"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportIssue;
