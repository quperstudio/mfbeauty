// sonner.tsx

// 🚀 CORRECCIÓN: Importar cada componente directamente desde su archivo para evitar el error de exportación en el bundler.
import { CircleCheck } from "lucide-react/dist/esm/icons/circle-check"
import { Info } from "lucide-react/dist/esm/icons/info"
import { LoaderCircle } from "lucide-react/dist/esm/icons/loader-circle"
import { OctagonX } from "lucide-react/dist/esm/icons/octagon-x"
import { TriangleAlert } from "lucide-react/dist/esm/icons/triangle-alert"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

// Este tipo se mantiene sin cambios
type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Iconos: Se mantienen como fallback, aunque la definicion en toastOptions es mas efectiva
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      // Opciones de estilo para los diferentes tipos de toast
      toastOptions={{
        classNames: {
          // Estilos base para todos los toasts
          toast:
            "group toast bg-background text-foreground border-border shadow-medium",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",

          // Estilos específicos para cada tipo usando tus colores
          success: "bg-success text-success-foreground border-success",
          error: "bg-error text-error-foreground border-error",
          warning: "bg-warning text-warning-foreground border-warning",
          info: "bg-info text-info-foreground border-info",
        },

        // Forzar el ícono para que sobrescriba el ícono predeterminado de Sonner
        error: {
          icon: <OctagonX className="h-4 w-4 text-error-foreground" />,
        },
        success: {
          icon: <CircleCheck className="h-4 w-4 text-success-foreground" />,
        },
        warning: {
          icon: <TriangleAlert className="h-4 w-4 text-warning-foreground" />,
        },
        info: {
          icon: <Info className="h-4 w-4 text-info-foreground" />,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }