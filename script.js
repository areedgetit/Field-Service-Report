document.addEventListener('DOMContentLoaded', function() {
  // Find the submit button
  const submitBtn = document.getElementById('submitBtn');

  // Add click event listener to the submit button
  submitBtn.addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the form element
    const form = document.querySelector('form');

    // Calculate the form's aspect ratio
    const formRect = form.getBoundingClientRect();
    const aspectRatio = formRect.height / formRect.width;

    // Set up PDF dimensions
    const { jsPDF } = window.jspdf;
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = pdfWidth * aspectRatio;
    const doc = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    // Use html2canvas to capture the form as an image
    html2canvas(form, {
      scale: 2, // Increase resolution
      useCORS: true,
      allowTaint: true,
      scrollY: -window.scrollY, // Adjust for any scrolling
      windowHeight: document.documentElement.offsetHeight
    }).then(canvas => {
      // Add the captured form image to the PDF
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Save the PDF
      doc.save('styled-form-data.pdf');
    }).catch(error => {
      console.error('Error in html2canvas operation:', error);
      alert('An error occurred while generating the PDF. Please check the console for more details.');
    });
  });
});