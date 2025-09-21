export interface ExtractedLink {
  type: 'url' | 'placeholder'
  text: string
  href?: string
}

export interface URLExtractionResult {
  hasLinks: boolean
  links: ExtractedLink[]
}

/**
 * Extracts URLs and link references from FAQ answers
 * Returns structured data with actual URLs and placeholders for vague references
 */
export function extractURLsFromAnswer(answer: string): URLExtractionResult {
  const links: ExtractedLink[] = []

  // Pattern to match explicit URLs (domains)
  const urlPattern = /(?:www\.|https?:\/\/)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?)/g
  const matches = answer.match(urlPattern)

  if (matches) {
    matches.forEach(match => {
      // Remove trailing punctuation (periods, commas, etc.)
      const cleanMatch = match.replace(/[.,;!?]$/, '')

      // Clean up the URL
      const cleanUrl = cleanMatch.startsWith('http') ? cleanMatch :
                      cleanMatch.startsWith('www.') ? `https://${cleanMatch}` :
                      `https://${cleanMatch}`
      links.push({
        type: 'url',
        text: cleanMatch,
        href: cleanUrl
      })
    })
  }

  // Check for vague link references and provide actual URLs
  const vagueReferences = [
    // Guest suggestions form
    { pattern: /share guest suggestions using this form/i, url: 'https://airtable.com/app3khvqyh3rdqa5g/pagmOcc3BAw8FIxDO/form' },
    // Speaking requests form
    { pattern: /submit your details through this form/i, url: 'https://airtable.com/appzMBzeGsDceqhoE/paglHM1ukVBcpOrGd/form' },
    // Podcast invitation form
    { pattern: /complete this form.*podcast/i, url: 'https://airtable.com/appDg88FrbCxePxpG/pagsREmsmZogaB9VQ/form' },
    // Sponsor interest form
    { pattern: /complete this form.*sponsor/i, url: 'https://airtable.com/app9yIGPaaYyDlhxz/pagIHDejSMThpcqSN/form' },
    // Newsletter signup
    { pattern: /join the Neural Network newsletter/i, url: 'https://www.hubermanlab.com/newsletter' },
    // Email list for events
    { pattern: /join our email list/i, url: 'https://www.hubermanlab.com/events' },
    // Past newsletters
    { pattern: /available here/i, url: 'https://www.hubermanlab.com/newsletter' },
    // Help articles
    { pattern: /review these help articles/i, url: 'https://support.supercast.com/category/53-subscriber-support' },
    // Stanford lab website - publications
    { pattern: /Stanford lab website.*publications/i, url: 'https://hubermanlab.stanford.edu/publications' },
    // Stanford lab website - research
    { pattern: /Stanford lab website.*research/i, url: 'https://hubermanlab.stanford.edu/giving' },
    // Stanford lab website - general
    { pattern: /Stanford lab website/i, url: 'https://hubermanlab.stanford.edu/' },
  ]

  vagueReferences.forEach(({ pattern, url }) => {
    if (pattern.test(answer)) {
      // Extract the domain name for display text
      const displayText = url.replace(/^https?:\/\//, '').split('/')[0]

      // Check if we haven't already added this URL
      if (!links.some(link => link.href === url)) {
        links.push({
          type: 'url',
          text: displayText,
          href: url
        })
      }
    }
  })

  return {
    hasLinks: links.length > 0,
    links
  }
}

/**
 * Maps known FAQ patterns to their actual URLs
 * This could be expanded with a more comprehensive mapping
 */
export function getKnownURLMappings(): Record<string, string> {
  return {
    'shop.hubermanlab.com': 'https://shop.hubermanlab.com',
    'hubermanlab.com/search': 'https://hubermanlab.com/search',
    'www.supercast.com': 'https://www.supercast.com',
    'support@supercast.com': 'mailto:support@supercast.com',
  }
}