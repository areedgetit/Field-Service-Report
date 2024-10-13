document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitBtn');

  // Add custom CSS to the page to improve input, select, and checkbox rendering
  const style = document.createElement('style');
  style.textContent = `
    .pdf-input, .pdf-select {
      min-height: 30px !important;
      line-height: 30px !important;
      padding: 5px !important;
      margin-bottom: 5px !important;
      border: 1px solid #ccc !important;
      box-sizing: border-box !important;
    }
    .pdf-select-value {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: white;
      padding: 5px;
      line-height: 30px;
      pointer-events: none;
    }
    .pdf-checkbox-container {
      display: inline-block !important;
      width: 20px !important;
      height: 20px !important;
      border: 1px solid #ccc !important;
      position: relative !important;
      margin-right: 5px !important;
      vertical-align: middle !important;
    }
    .pdf-checkbox-container::after {
      content: '✓';
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px;
      line-height: 1;
      opacity: 0;
    }
    .pdf-checkbox-container.checked::after {
      opacity: 1;
    }
    .pdf-checkbox-label {
      vertical-align: middle !important;
    }
  `;
  document.head.appendChild(style);

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, and textarea elements
    form.querySelectorAll('input:not([type="checkbox"]), textarea').forEach(el => {
      el.classList.add('pdf-input');
    });
    form.querySelectorAll('select').forEach(el => {
      el.classList.add('pdf-select');
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
        // Ensure text is visible in cloned inputs
        clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
          if (el.value) {
            el.style.color = 'black';
            el.style.fontSize = '16px';
          }
        });
        
        // Handle select elements
        clonedDoc.querySelectorAll('.pdf-select').forEach(select => {
          const selectedOption = select.options[select.selectedIndex];
          const selectedText = selectedOption ? selectedOption.text : '';
          
          const valueDisplay = document.createElement('div');
          valueDisplay.className = 'pdf-select-value';
          valueDisplay.textContent = selectedText;
          valueDisplay.style.color = 'black';
          valueDisplay.style.fontSize = '16px';
          
          select.parentNode.insertBefore(valueDisplay, select.nextSibling);
          select.style.color = 'transparent';
          select.style.webkitTextFillColor = 'transparent';
        });

        // Handle checkbox elements
        clonedDoc.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          const container = document.createElement('span');
          container.className = 'pdf-checkbox-container';
          if (checkbox.checked) {
            container.classList.add('checked');
          }
          
          const label = document.createElement('span');
          label.className = 'pdf-checkbox-label';
          label.textContent = checkbox.nextSibling.textContent.trim();
          
          checkbox.parentNode.insertBefore(container, checkbox);
          checkbox.parentNode.insertBefore(label, checkbox.nextSibling);
          checkbox.style.display = 'none';
        });
      }
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save('styled-form-data.pdf');

      // Remove the temporary container
      document.body.removeChild(tempContainer);
      
      // Remove custom classes from original form elements
      form.querySelectorAll('.pdf-input, .pdf-select').forEach(el => {
        el.classList.remove('pdf-input', 'pdf-select');
      });
    }).catch(error => {
      console.error('Error in html2canvas operation:', error);
      alert('An error occurred while generating the PDF. Please check the console for more details.');
      
      // Remove the temporary container in case of error
      document.body.removeChild(tempContainer);
      
      // Remove custom classes from original form elements
      form.querySelectorAll('.pdf-input, .pdf-select').forEach(el => {
        el.classList.remove('pdf-input', 'pdf-select');
      });
    });
  });
});