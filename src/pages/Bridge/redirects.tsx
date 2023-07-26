import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

// Redirects to bridge but only replace the pathname
export function RedirectPathToBridgeOnly({ location }: RouteComponentProps) {
  return <Redirect to={{ ...location, pathname: '/bridge' }} />
}

// Redirects from the /bridge/:outputCurrency path to the /bridge?outputCurrency=:outputCurrency format
export function RedirectToBridge(props: RouteComponentProps<{ outputCurrency: string }>) {
  const {
    location: { search },
    match: {
      params: { outputCurrency }
    }
  } = props

  return (
    <Redirect
      to={{
        ...props.location,
        pathname: '/bridge',
        search:
          search && search.length > 1
            ? `${search}&outputCurrency=${outputCurrency}`
            : `?outputCurrency=${outputCurrency}`
      }}
    />
  )
}
