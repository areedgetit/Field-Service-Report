document.addEventListener('DOMContentLoaded', function() {
  const dwnBtn = document.getElementById('dwnBtn');
  const sbmt = document.getElementById('sbmt');
  const inputDivs = document.querySelectorAll('.input-div');
  const number = document.getElementById('Machine-Number');
  const date = document.getElementById('date');
  const gang = document.getElementById('gang-number');
  
  // Function to validate required fields
  function validateForm() {
    const errors = [];
    
    // Check if machine type is selected
    const machine = document.querySelector('input[name="machineType"]:checked');
    if (!machine) {
      errors.push('Machine Type');
    }
    
    // Check machine number
    if (!number.value.trim()) {
      errors.push('Machine Number');
    }
    
    // Check date
    if (!date.value) {
      errors.push('Date');
    }
    
    // Check gang number
    if (!gang.value.trim()) {
      errors.push('Gang Number');
    }
    
    return errors;
  }
  
  // Function to show validation errors
  function showValidationErrors(errors) {
    if (errors.length === 0) return true;
    
    let errorMessage = 'Please fill out the following required fields:\n\n';
    errors.forEach(field => {
      errorMessage += `• ${field}\n`;
    });
    
    alert(errorMessage);
    return false;
  }
  
  // Function to add custom CSS styles
  function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .pdf-input {
        min-height: 30px !important;
        line-height: 30px !important;
        padding: 5px !important;
        margin-bottom: 5px !important;
        border: 1px solid #ccc !important;
        box-sizing: border-box !important;
        overflow: hidden;
        resize: none;
      }
      .input-div {
        border: 1px solid #ccc;
        padding: 5px;
        min-height: 30px;
        width: 300px; 
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.5;
        max-height: 300px;
        overflow-y: auto;
        overflow: hidden;
        padding-bottom: 40px;
      }
      #submitBtn {
        min-height: 30px !important;
        line-height: 30px !important;
        padding: 5px !important;
        margin-bottom: 5px !important;
        border: 1px solid #ccc !important;
        box-sizing: border-box !important;
        overflow: hidden;
        resize: none;
      }  
      #main-info label > input[type="checkbox"] {
        margin-left: 5px; 
        margin-top: 20px;
      }  
    `;
    document.head.appendChild(style);
  }

  // Function to adjust height of contenteditable div
  function adjustHeight(inputDiv) {
    inputDiv.style.height = 'auto';
    inputDiv.style.height = inputDiv.scrollHeight + 'px';
  }

  // Loop through each inputDiv and add event listeners
  inputDivs.forEach(inputDiv => {
    inputDiv.addEventListener('input', function() {
      adjustHeight(inputDiv);
    });

    inputDiv.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.focus();
    });

    inputDiv.addEventListener('mousedown', function(e) {
      e.preventDefault();
      this.focus();
    });

    adjustHeight(inputDiv);
  });

  // Function to auto-resize textareas
  function autoResizeTextareas() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    });
  }

  autoResizeTextareas();

  // Function to generate PDF (shared between download and submit)
  function generatePDF(callback) {
    // Validate form first
    const validationErrors = validateForm();
    if (!showValidationErrors(validationErrors)) {
      return; // Stop if validation fails
    }
    
    const machine = document.querySelector('input[name="machineType"]:checked');
    addCustomStyles();

    const form = document.querySelector('form');

    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
      el.classList.add('pdf-input');
    });

    const formHeight = form.scrollHeight;
    const formWidth = form.offsetWidth;

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = formWidth + 'px';
    tempContainer.style.height = formHeight + 'px';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.pointerEvents = 'none';

    const clonedForm = form.cloneNode(true);
    tempContainer.appendChild(clonedForm);
    document.body.appendChild(tempContainer);

    setTimeout(() => {
      const aspectRatio = formHeight / formWidth;

      html2canvas(tempContainer, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        height: formHeight,
        windowHeight: formHeight,
        quality: 0.8,
        backgroundColor: '#ffffff',
        onclone: function(clonedDoc) {
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.getAttribute('contenteditable') === 'true') {
              el.style.color = 'black';
              el.style.fontSize = '14px';
              el.textContent = el.textContent;
            } else if (el.value) {
              el.style.color = 'black';
              el.style.fontSize = '14px';
            }
          });
        }
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        
        const maxPdfWidth = 210;
        const maxPdfHeight = 297;
        
        let pdfWidth, pdfHeight;
        if (aspectRatio > 1) {
          pdfHeight = maxPdfHeight;
          pdfWidth = maxPdfHeight / aspectRatio;
        } else {
          pdfWidth = maxPdfWidth;
          pdfHeight = maxPdfWidth * aspectRatio;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
          compress: true
        });

        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'MEDIUM');
        const fileName = `${machine.value}-${number.value}-${gang.value}-${date.value}.pdf`;

        // Cleanup
        document.body.removeChild(tempContainer);
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });

        // Call the callback with doc and fileName
        callback(doc, fileName);
        
      }).catch(error => {
        console.error('Error in html2canvas operation:', error);
        alert('An error occurred while generating the PDF. Please try again or contact support if the problem persists.');
        
        document.body.removeChild(tempContainer);
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      });
    }, 100);
  }

  // Download button handler
  dwnBtn.addEventListener('click', function(event) {
    event.preventDefault();
    
    generatePDF((doc, fileName) => {
      doc.save(fileName);
      alert('PDF downloaded successfully!');
    });
  });
  
  // Submit button handler
  sbmt.addEventListener('click', function(event) {
    event.preventDefault();
    
    generatePDF((doc, fileName) => {
      const pdfBlob = doc.output('blob');

      console.log('Starting upload to function...');
      console.log('PDF blob size:', pdfBlob.size);
      console.log('PDF blob type:', pdfBlob.type);
      
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (pdfBlob.size > maxSize) {
        alert(`PDF is too large (${Math.round(pdfBlob.size / 1024 / 1024)}MB). Maximum size is ${maxSize / 1024 / 1024}MB.`);
        return;
      }
      
      fetch(`/.netlify/functions/uploadfile?fileName=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: pdfBlob,
      })
      .then(response => {
        console.log('Got response from function:', response.status, response.statusText);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', [...response.headers.entries()]);
        
        return response.text().then(text => {
          console.log('Raw response text:', text);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text}`);
          }
          
          try {
            return JSON.parse(text);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            throw new Error(`Invalid JSON response: ${text}`);
          }
        });
      })
      .then(result => {
        if (result.message === 'File uploaded successfully') {
          alert('PDF uploaded to SharePoint successfully!');
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      })
      .catch(error => {
        console.error('Upload error:', error);
        alert('Error uploading PDF to SharePoint: ' + error.message);
      });
    });
  });
});