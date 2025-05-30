export const fileUpload = (formData) => ({
  fileName: null,
  fileExt: null,
  formData: formData,

  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Update the display
    this.fileName = file.name.split('.')[0];
    this.fileExt = file.name.split('.').pop();

    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to server
      const response = await fetch('/api/credentials?action=upload', {
        method: 'POST',
        body: formData
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please try again.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to upload profile picture');
      }

      // Store the URL in the form data
      this.formData.profilePictureUrl = data.url;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile picture: ' + error.message);
    }
  }
}); 