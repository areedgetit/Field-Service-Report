document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitBtn');

  // Add custom CSS to the page to improve input rendering
  const style = document.createElement('style');
  style.textContent = `
    .pdf-input {
      min-height: 30px !important;
      line-height: 30px !important;
      padding: 5px !important;
      margin-bottom: 5px !important;
      border: 1px solid #ccc !important;
      box-sizing: border-box !important;
      overflow: hidden; /* Prevent scrollbars */
      resize: none; /* Disable manual resizing */
    }
    .editable-div {
      border: 1px solid #ccc;
      padding: 5px;
      min-height: 30px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: inherit;
      line-height: 1.5;
      background-color: #fff;
      overflow-y: auto;
      max-height: 150px; /* Adjust as needed */
    }
  `;
  document.head.appendChild(style);

  // Function to handle input in editable divs
  function handleEditableInput(event) {
    const div = event.target;
    // Optionally, you can limit the length
    if (div.textContent.length > 500) { // Example: 500 character limit
      div.textContent = div.textContent.slice(0, 500);
    }
  }

  // Add event listeners to editable divs
  document.querySelectorAll('.editable-div').forEach(div => {
    div.addEventListener('input', handleEditableInput);
  });

  // Function to auto-resize textareas
  function autoResizeTextareas() {
    const textareas = document.querySelectorAll('textarea');

    textareas.forEach(textarea => {
      textarea.addEventListener('input', function() {
        this.style.height = 'auto'; // Reset height to auto
        this.style.height = this.scrollHeight + 'px'; // Set to scrollHeight
      });
    });
  }

  // Initialize auto-resizing on textareas
  autoResizeTextareas();

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, textarea, and editable div elements
    form.querySelectorAll('input, select, textarea, .editable-div').forEach(el => {
      el.classList.add('pdf-input');
    });

    // Get the full height of the form
    const formHeight = form.scrollHeight;
    const formWidth = form.offsetWidth;

    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = formWidth + 'px';
    tempContainer.style.height = formHeight + 'px';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.pointerEvents = 'none';

    // Clone the form and append it to the temporary container
    const clonedForm = form.cloneNode(true);
    tempContainer.appendChild(clonedForm);
    document.body.appendChild(tempContainer);

    // Delay to ensure everything is rendered properly
    setTimeout(() => {
      // Calculate aspect ratio
      const aspectRatio = formHeight / formWidth;

      // Set up PDF dimensions
      const { jsPDF } = window.jspdf;
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = pdfWidth * aspectRatio;
      const doc = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: formHeight,
        windowHeight: formHeight,
        onclone: function(clonedDoc) {
          // Ensure text is visible in cloned inputs and editable divs
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.tagName.toLowerCase() === 'div') {
              el.style.color = 'black';
              el.style.fontSize = '16px';
              // Ensure the content of the div is preserved
              el.textContent = el.textContent;
            } else if (el.value) {
              el.style.color = 'black';
              el.style.fontSize = '16px';
            }
          });
        }
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save('styled-form-data.pdf');

        // Remove the temporary container
        document.body.removeChild(tempContainer);
        
        // Remove custom class from original form elements
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      }).catch(error => {
        console.error('Error in html2canvas operation:', error);
        alert('An error occurred while generating the PDF. Please check the console for more details.');
        
        // Remove the temporary container in case of error
        document.body.removeChild(tempContainer);
        
        // Remove custom class from original form elements
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      });
    }, 100); // Adjust the delay if necessary
  });

  // If you need to get form data (e.g., for form submission)
  function getFormData(form) {
    const formData = new FormData(form);
    form.querySelectorAll('.editable-div').forEach(div => {
      formData.append(div.dataset.name, div.textContent);
    });
    return formData;
  }
});
