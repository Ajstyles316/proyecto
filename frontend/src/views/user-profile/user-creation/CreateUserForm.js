import { Box, TextField, MenuItem, IconButton, Button } from '@mui/material';
import PropTypes from 'prop-types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const CreateUserForm = ({ 
  form, 
  errors, 
  options, 
  showGeneratedPassword, 
  onFormChange, 
  onGeneratePassword, 
  onTogglePasswordVisibility 
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      <TextField
        name="Nombre"
        label="Nombre Completo"
        value={form.Nombre}
        onChange={onFormChange}
        error={!!errors.Nombre}
        helperText={errors.Nombre}
        fullWidth
        required
      />
      
      <TextField
        name="Email"
        label="Correo Electrónico"
        type="email"
        value={form.Email}
        onChange={onFormChange}
        error={!!errors.Email}
        helperText={errors.Email}
        fullWidth
        required
        placeholder="usuario@gmail.com"
      />
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          name="Cargo"
          label="Cargo"
          value={form.Cargo}
          onChange={onFormChange}
          error={!!errors.Cargo}
          helperText={errors.Cargo}
          select
          fullWidth
          required
        >
          {options.cargos
            .filter(cargo => cargo.toLowerCase() !== 'admin')
            .map(cargo => (
              <MenuItem key={cargo} value={cargo}>{cargo}</MenuItem>
            ))}
        </TextField>
        
        <TextField
          name="Unidad"
          label="Unidad"
          value={form.Unidad}
          onChange={onFormChange}
          error={!!errors.Unidad}
          helperText={errors.Unidad}
          select
          fullWidth
          required
        >
          {options.unidades.map(unidad => (
            <MenuItem key={unidad} value={unidad}>{unidad}</MenuItem>
          ))}
        </TextField>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          name="Password"
          label="Contraseña"
          type={showGeneratedPassword ? "text" : "password"}
          value={form.Password}
          onChange={onFormChange}
          error={!!errors.Password}
          helperText={errors.Password || "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial"}
          fullWidth
          required
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={onTogglePasswordVisibility}
                edge="end"
              >
                {showGeneratedPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            ),
          }}
        />
        <Button
          variant="outlined"
          onClick={onGeneratePassword}
          sx={{ minWidth: 'auto', px: 2 }}
          title="Generar contraseña automática"
        >
          Generar
        </Button>
      </Box>
    </Box>
  );
};

CreateUserForm.propTypes = {
  form: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
  showGeneratedPassword: PropTypes.bool.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onGeneratePassword: PropTypes.func.isRequired,
  onTogglePasswordVisibility: PropTypes.func.isRequired,
};

export default CreateUserForm;
