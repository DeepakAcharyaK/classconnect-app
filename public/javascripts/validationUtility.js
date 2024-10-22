function validateForm(fields) {
    let isValid = true;

    fields.forEach(({ field, errorElement, validations }) => {
        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        let fieldIsValid = true;

        validations.forEach((validation) => {
            switch (validation.type) {
                case 'required':
                    if (!value) {
                        errorElement.textContent = validation.message;
                        errorElement.classList.remove('hidden');
                        fieldIsValid = false;
                    }
                    break;

                case 'pattern':
                        const regex = new RegExp(validation.pattern);
                        if (!regex.test(value)) {
                            errorElement.textContent = validation.message;
                            errorElement.classList.remove('hidden');
                            fieldIsValid = false;
                        }
                    break;
                case 'email':
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(value)) {
                        errorElement.textContent = validation.message;
                        errorElement.classList.remove('hidden');
                        fieldIsValid = false;
                    }
                    break;
                case 'tel':
                    const phonePattern = /^\d{10}$/; // For a 10-digit number
                    if (!phonePattern.test(value)) {
                        errorElement.textContent = validation.message;
                        errorElement.classList.remove('hidden');
                        fieldIsValid = false;
                    }
                    break;
                case 'minLength':
                    if (value.length < validation.length) {
                        errorElement.textContent = validation.message;
                        errorElement.classList.remove('hidden');
                        fieldIsValid = false;
                    }
                    break;
            }
        });

        if (fieldIsValid) {
            errorElement.classList.add('hidden');
        } else {
            isValid = false;
        }
    });

    return isValid;
}
