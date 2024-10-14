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
    }
  `;
  document.head.appendChild(style);

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, and textarea elements
    form.querySelectorAll('input, select, textarea').forEach(el => {
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
  });
});
