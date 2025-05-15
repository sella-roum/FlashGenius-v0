interface PageTitleProps {
  title: string
  subtitle?: string
}

export const PageTitle = ({ title, subtitle }: PageTitleProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  )
}
