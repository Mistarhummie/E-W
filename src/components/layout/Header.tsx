import { TRAINING_TYPES } from '../../lib/catalogue'
import { getCategories } from '../../lib/queries'
import { HeaderClient, type NavItem } from './HeaderClient'

export async function Header() {
  const categories = await getCategories()
  const top = (section: string) =>
    categories
      .filter((c) => c.section === section && !c.parent)
      .map((c) => ({ label: c.title, href: `/shop?category=${c.slug}` }))

  const nav: NavItem[] = [
    {
      label: 'Jerseys',
      href: '/shop?section=jerseys',
      columns: [
        { title: 'Leagues', links: top('jerseys') },
        {
          title: 'Featured',
          links: [
            { label: 'New in', href: '/shop?section=jerseys&tag=new' },
            { label: 'Top sellers', href: '/shop?section=jerseys&sort=popular' },
            { label: 'Customise your kit', href: '/shop?section=jerseys&custom=1' },
            { label: 'Deals', href: '/shop?tag=deal' },
          ],
        },
      ],
      promo: { title: 'Your name. Your number.', text: 'Add a name, number and badges to any jersey.', href: '/shop?section=jerseys' },
    },
    {
      label: 'Gym wear',
      href: '/gym',
      columns: [
        {
          title: 'Shop',
          links: [
            { label: 'Women', href: '/shop?section=gym&gender=women' },
            { label: 'Men', href: '/shop?section=gym&gender=men' },
            ...top('gym'),
          ],
        },
        { title: 'How do you train?', links: TRAINING_TYPES.map((t) => ({ label: t.label, href: `/shop?section=gym&training=${t.value}` })) },
      ],
    },
    { label: 'Kids', href: '/shop?section=kids' },
    { label: 'Deals', href: '/shop?tag=deal', accent: true },
    { label: 'Blog', href: '/blog' },
  ]

  return <HeaderClient nav={nav} />
}
