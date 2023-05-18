exports.isValidDate = (dateString) => {
	// Check if the date string matches "2023-05-18T00:31"
	const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
	if (!regex.test(dateString)) {
	  return false;
	}
  
	// Parse the date and check if it's a valid date object
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
	  return false;
	}
  
	// Ensure the date-time string components match the parsed date object
	const components = dateString.split('-');
	const year = parseInt(components[0]);
	const month = parseInt(components[1]);
	const day = parseInt(components[2].split('T')[0]);
	const hours = parseInt(components[2].split('T')[1].split(':')[0]);
	const minutes = parseInt(components[2].split('T')[1].split(':')[1]);
  
	return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day && date.getHours() === hours && date.getMinutes() === minutes;
}
  