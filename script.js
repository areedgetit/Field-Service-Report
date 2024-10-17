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
      overflow: hidden; /* Prevent scrollbars */
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
      overflow-y: auto; /* Add scrollbar if content exceeds height */
      max-height: 300px; /* Optional: set a maximum height */
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
      e.stopPropagation(); // Ensure clicks work
    });
    inputDiv.addEventListener('mousedown', function(e) {
      e.preventDefault(); // Prevent focus jump
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
    tempContainer.style.width = '0px';
    tempContainer.style.height = '0px';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.pointerEvents = 'none';

    // Clone the form and append it to the temporary container
    const clonedForm = form.cloneNode(true);
    tempContainer.appendChild(clonedForm);
    document.body.appendChild(tempContainer);

    // Delay to ensure everything is rendered properly
    setTimeout(() => {
      // Capture the screenshot
      html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        onclone: function(clonedDoc) {
          // Ensure text is visible in cloned inputs and contenteditable divs
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.getAttribute('contenteditable') === 'true') {
              el.style.color = 'black';
              el.style.fontSize = '16px';
              el.textContent = el.textContent; // Ensure the content of the div is preserved
            } else if (el.value) {
              el.style.color = 'black';
              el.style.fontSize = '16px';
            }
          });
        }
      }).then(canvas => {
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4'
        });

        // Add the canvas as an image to the PDF
        const imgData = canvas.toDataURL('image/png');
        const pageHeight = pdf.internal.pageSize.height;
        let contentHeight = canvas.height;

        let currentY = 0;

        while (contentHeight > 0) {
          let drawHeight = Math.min(contentHeight, pageHeight - currentY);
          pdf.addImage(imgData, 'PNG', 0, currentY, canvas.width, drawHeight);
          currentY += drawHeight;

          if (currentY >= pageHeight) {
            pdf.addPage();
            currentY = 0;
          }

          contentHeight -= drawHeight;
        }

        // Save the PDF
        pdf.save('styled-form-data.pdf');

        // Clean up
        document.body.removeChild(tempContainer);
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      }).catch(error => {
        console.error('Error in html2canvas operation:', error);
        alert('An error occurred while generating the PDF. Please check the console for more details.');

        // Clean up
        document.body.removeChild(tempContainer);
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      });
    }, 100); // Adjust the delay if necessary
  });
});
