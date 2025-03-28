document.addEventListener('DOMContentLoaded', function() {
  const dwnBtn = document.getElementById('dwnBtn');
  const sbmt = document.getElementById('sbmt');
  const inputDivs = document.querySelectorAll('.input-div');
  //const machine = document.querySelector('input[name="machineType"]:checked');
  const number = document.getElementById('Machine-Number');
  const date = document.getElementById('date');
  const gang = document.getElementById('gang-number'); 
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
        overflow: hidden; /* Prevent scrollbars */
        resize: none; /* Disable manual resizing */
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
        max-height: 300px; /* Optional: set a maximum height */
        overflow-y: auto; /* Add scrollbar if content exceeds max-height */
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
        overflow: hidden; /* Prevent scrollbars */
        resize: none; /* Disable manual resizing */  
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
      adjustHeight(inputDiv); // Pass the current inputDiv
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

    // Initial call to set the correct height
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

  // Initialize auto-resizing on textareas
  autoResizeTextareas();

  dwnBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const machine = document.querySelector('input[name="machineType"]:checked');
    // Add custom CSS styles when the submit button is clicked
    addCustomStyles();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, textarea, and contenteditable elements
    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
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
                  
          // Ensure text is visible in cloned inputs and contenteditable divs
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.getAttribute('contenteditable') === 'true') {
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
        const fileName = `${machine.value}-${number.value}-${gang.value}-${date.value}.pdf`
        doc.save(fileName);

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
  sbmt.addEventListener('click', function(event) {
    event.preventDefault();
    const machine = document.querySelector('input[name="machineType"]:checked');
    // Add custom CSS styles when the submit button is clicked
    addCustomStyles();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, textarea, and contenteditable elements
    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
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
                  
          // Ensure text is visible in cloned inputs and contenteditable divs
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.getAttribute('contenteditable') === 'true') {
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
        const fileName = `${machine.value}-${number.value}-${gang.value}-${date.value}.pdf`
        //doc.save(fileName); can be added in if mechanics want copy downloaded
          
        // Convert the PDF to a Blob
      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);
      // Upload the PDF to Netlify function
      //const statusMessage = document.getElementById("statusMessage"); // Adjust based on your element ID

      fetch(`/.netlify/functions/uploadFile?fileName=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: pdfBlob, // Send the PDF as raw data
      })
      .then(response => response.json())
      .then(result => {
        if (result.message === 'File uploaded successfully') {
            alert('PDF uploaded to SharePoint successfully!');
        } else {
            throw new Error(result.error || 'Upload failed');
        }
        })
       .catch(error => {
        console.error('Upload error:', error);
        alert('Error uploading PDF: ' + error.message);
        });                
        
        
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
});
