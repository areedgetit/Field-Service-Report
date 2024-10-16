document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitBtn');
  const inputDivs = document.querySelectorAll('.input-div');

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
      overflow: visible !important;
      resize: none; /* Disable manual resizing */
    }
    .input-div {
      min-height: 30px !important;
      line-height: 30px !important;
      padding: 5px !important;
      margin-bottom: 5px !important;
      border: 1px solid #ccc !important;
      box-sizing: border-box !important;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);

  // Function to adjust height of contenteditable div
  function adjustHeight() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  }

  // Event listeners for contenteditable divs
  inputDivs.forEach(inputDiv => {
    inputDiv.addEventListener('input', adjustHeight);
    inputDiv.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });
    inputDiv.addEventListener('mousedown', function(e) {
      e.preventDefault();
      this.focus();
    });
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

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, textarea, and contenteditable elements
    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
      el.classList.add('pdf-input');
    });

    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = form.offsetWidth + 'px';
    tempContainer.style.height = 'auto';
    tempContainer.style.background = 'white';
    tempContainer.style.zIndex = '-9999';
    document.body.appendChild(tempContainer);

    // Clone the form and append it to the temporary container
    const clonedForm = form.cloneNode(true);
    tempContainer.appendChild(clonedForm);

    // Remove any max-height constraints
    tempContainer.querySelectorAll('*').forEach(el => {
      el.style.maxHeight = 'none';
      el.style.height = 'auto';
    });

    // Delay to ensure everything is rendered properly
    setTimeout(() => {
      html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        onclone: function(clonedDoc) {
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.getAttribute('contenteditable') === 'true') {
              el.style.color = 'black';
              el.style.fontSize = '16px';
              el.textContent = el.textContent;
            } else if (el.value) {
              el.style.color = 'black';
              el.style.fontSize = '16px';
            }
          });
        }
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new PDFDocument();
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('form-data.pdf');

        // Clean up
        document.body.removeChild(tempContainer);
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      }).catch(error => {
        console.error('Error in html2canvas operation:', error);
        alert('An error occurred while generating the PDF. Please check the console for more details.');
        document.body.removeChild(tempContainer);
      });
    }, 100);
  });
});
