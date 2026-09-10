He estado haciendo pruebas exhaustivas de UI/UX en el frontend y el sistema funciona excelente, pero tenemos 8 deudas técnicas enfocadas en el diseño, la usabilidad y el rendimiento que necesito que soluciones en este mismo orden:

1. Tooltip desubicado en el formulario:
Hay un tooltip emergente verde que dice "Ingresa tu cedula aqui" con una flecha. Actualmente está mal posicionado: la flecha se ve rara y el cuadro tapa por completo el texto del textarea "Descripción del Problema". Necesito que lo reubiques (quizás justo al lado del input de Cédula o arriba) para que no obstruya la lectura. Si es posible, haz que aparezca solo al hacer :focus en el input correspondiente o usa posicionamiento absoluto correcto.

2. Falta de indicación visual (Cursor Pointer):
Los botones y elementos interactivos tienen animaciones de hover, pero el cursor del sistema no cambia a la "manito" (pointer). Por favor, haz una revisión general y añade la clase cursor-pointer (o su equivalente en CSS) a todos los botones, enlaces y cards clickeables de la aplicación.

3. Copywriting del Panel Principal:
El texto de bienvenida actual es confuso ("El verde guia la accion..."). Cámbialo por un mensaje institucional, amable y claro. Sugerencia de título: "Bienvenido al Portal de Soporte SAIA-SIAD". Sugerencia de descripción: "Desde este panel podrás gestionar de forma ágil y segura tus solicitudes de reseteo de contraseñas, configuración de correo institucional y recuperación de accesos a las plataformas académicas."

4. Copywriting de "Flujos disponibles":
Mejora también este texto. Sugerencia de título: "Servicios Habilitados". Sugerencia de descripción: "Las solicitudes son procesadas bajo estrictos controles de seguridad. Recuerda que para requerimientos de acceso es obligatorio adjuntar tu documento de identidad para la validación del personal de soporte TI."

5. Modal de Ayuda (Navbar):
Actualmente el botón "Ayuda" del Navbar no hace nada (o no tiene una vista propia). Crea un componente modal dinámico (HelpModal.jsx) usando Framer Motion (para mantener la coherencia de UI/UX). Este modal debe abrirse al hacer clic, tener un botón de cerrar, y contener información básica de contacto de soporte (ej. correo de mesa de ayuda, horarios de atención y una breve guía de uso).

6. Optimización del Efecto "Pulse/Radar":
Los iconos tienen una animación de radar/pulse que se ve tosca y forzada al final de su ciclo de repetición. Refactoriza los keyframes en Tailwind/CSS. Usa ease-in-out, ajusta la opacidad para que se desvanezca suavemente a 0 (opacity-0) al escalar, evitando cortes abruptos cuando el bucle reinicia.

7. Optimización de Rendimiento General (LAG):
El sistema presenta tirones y lag visual. Sabiendo cómo funciona React, esto seguro se debe a re-renderizados excesivos o animaciones no aceleradas por hardware. Por favor:

Revisa el componente del formulario y asegúrate de que escribir en los inputs no dispare un re-render de toda la página.

Si estamos usando efectos de partículas o Lenis Scroll, asegúrate de que estén optimizados, o que las animaciones de CSS usen transform y opacity (que usan la GPU) en lugar de animar márgenes o anchos.

Aplica React.memo, useMemo o useCallback en componentes pesados si es estrictamente necesario.

8. Error de TypeScript en prisma.config.ts:
En el backend (archivo sarci-backend/prisma.config.ts en la línea 12), VS Code me está marcando un error de linting/TypeScript que dice: "Cannot find name 'process'. Do you need to install type definitions for node?". Sé que esto no afecta la ejecución porque el servidor corre bien, pero quiero limpiar los warnings del editor. Por favor, instala @types/node como dependencia de desarrollo en el backend y, si es necesario, configura un tsconfig.json básico en esa carpeta para que el IDE lo reconozca y elimine la advertencia roja.

Por favor, confirma cuando hayas aplicado estas 8 mejoras y revisa cuidadosamente que la lógica de envío de datos siga intacta.