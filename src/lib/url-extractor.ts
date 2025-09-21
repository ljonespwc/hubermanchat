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

  // Check for vague link references
  const vagueReferences = [
    { pattern: /using this form/i, placeholder: '[Form link - visit hubermanlab.com/faq]' },
    { pattern: /through this form/i, placeholder: '[Form link - visit hubermanlab.com/faq]' },
    { pattern: /complete this form/i, placeholder: '[Form link - visit hubermanlab.com/faq]' },
    { pattern: /available here/i, placeholder: '[Link - visit hubermanlab.com/faq]' },
    { pattern: /review these help articles/i, placeholder: '[Help articles - visit support.supercast.com]' },
    { pattern: /Stanford lab website/i, placeholder: '[Stanford lab - visit profiles.stanford.edu/andrew-huberman]' },
    { pattern: /join the Neural Network newsletter/i, placeholder: '[Newsletter signup - visit hubermanlab.com]' },
    { pattern: /join our email list/i, placeholder: '[Email signup - visit hubermanlab.com]' },
  ]

  vagueReferences.forEach(({ pattern, placeholder }) => {
    if (pattern.test(answer) && !links.some(link => link.text === placeholder)) {
      links.push({
        type: 'placeholder',
        text: placeholder
      })
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